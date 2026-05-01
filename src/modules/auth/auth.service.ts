import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../core/enums/enums';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
      role: UserRole.ADMIN,
      document: dto.adminDocument,
      tenantId: tenant.id,
    });

    return this.issueTokens(user.id, user.email, user.role, tenant.id);
  }

  async login(dto: LoginDto) {
    const user = await this.findUserByIdentifier(dto.identifier);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Credenciais inválidas');

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
        expiresIn: this.config.getOrThrow<string>('app.jwt.accessExpiresIn') as unknown as number,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('app.jwt.refreshSecret'),
        expiresIn: this.config.getOrThrow<string>('app.jwt.refreshExpiresIn') as unknown as number,
      }),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.usersService.updateRefreshToken(userId, hashedRefresh);

    return { accessToken, refreshToken };
  }
}
