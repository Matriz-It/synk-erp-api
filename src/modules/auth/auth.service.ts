import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '../../core/enums/enums';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const tenant = await this.tenantsService.create(
      dto.tenantName,
      dto.tenantDocument,
    );

    const hashedPassword = await bcrypt.hash(dto.adminPassword, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      name: dto.adminName,
      email: dto.adminEmail,
      password: hashedPassword,
      role: UserRole.PROPRIETARIO,
      document: dto.adminDocument,
      tenantId: tenant.id,
    });

    return this.issueTokens(user.id, user.email, user.role, tenant.id);
  }

  async login(dto: LoginDto) {
    const user = await this.findUserByIdentifier(dto.identifier);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch)
      throw new UnauthorizedException('Credenciais inválidas');

    if (user.status === UserStatus.INACTIVE)
      throw new UnauthorizedException('Usuário inativo. Contate o administrador.');

    return this.issueTokens(user.id, user.email, user.role, user.tenantId);
  }

  private findUserByIdentifier(identifier: string) {
    const digits = identifier.replace(/\D/g, '');

    if (digits.length === 11) {
      return this.usersService.findByDocument(digits);
    }

    if (digits.length === 14) {
      return this.usersService.findAdminByTenantDocument(digits);
    }

    return this.usersService.findByEmail(identifier.toLowerCase().trim());
  }

  async refreshTokens(
    userId: string,
    email: string,
    role: UserRole,
    tenantId: string,
  ) {
    return this.issueTokens(userId, email, role, tenantId);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async getMe(userId: string, tenantId: string) {
    const [user, tenant] = await Promise.all([
      this.usersService.findById(userId),
      this.tenantsService.findById(tenantId),
    ]);
    return {
      user: {
        id: user?.id ?? '',
        name: user?.name ?? '',
        email: user?.email ?? '',
        role: user?.role ?? UserRole.PROPRIETARIO,
      },
      tenant: {
        name: tenant?.name ?? '',
        document: tenant?.document ?? null,
        plan: tenant?.plan ?? 'free',
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(userId, dto);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      document: user.document ?? '',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const match = await bcrypt.compare(dto.currentPassword, user.password);
    if (!match) throw new BadRequestException('Senha atual incorreta');

    if (dto.currentPassword === dto.newPassword)
      throw new BadRequestException('A nova senha deve ser diferente da atual');

    const hashed = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.usersService.updatePassword(userId, hashed);
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: UserRole,
    tenantId: string,
  ) {
    const payload: JwtPayload = { sub: userId, email, role, tenantId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('app.jwt.accessSecret'),
        expiresIn: this.config.getOrThrow<string>(
          'app.jwt.accessExpiresIn',
        ) as unknown as number,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('app.jwt.refreshSecret'),
        expiresIn: this.config.getOrThrow<string>(
          'app.jwt.refreshExpiresIn',
        ) as unknown as number,
      }),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.usersService.updateRefreshToken(userId, hashedRefresh);

    return { accessToken, refreshToken };
  }
}
