import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '../../core/enums/enums';
import { User } from '../users/entities/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async list(tenantId: string) {
    const users = await this.repo.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });
    return users.map((u) => this.mapEmployee(u));
  }

  async create(tenantId: string, dto: CreateEmployeeDto) {
    const existing = await this.repo.findOneBy({ email: dto.email.toLowerCase().trim() });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const hashed = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.repo.save(
      this.repo.create({
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        password: hashed,
        role: dto.role,
        status: UserStatus.ACTIVE,
        document: dto.document ? dto.document.replace(/\D/g, '') : null,
        tenantId,
      }),
    );
    return this.mapEmployee(user);
  }

  async update(tenantId: string, id: string, dto: UpdateEmployeeDto) {
    const user = await this.repo.findOneBy({ id, tenantId });
    if (!user) throw new NotFoundException('Funcionário não encontrado');
    if (user.role === UserRole.PROPRIETARIO) {
      throw new ForbiddenException('Não é possível editar o proprietário');
    }

    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.status !== undefined) user.status = dto.status;
    if (dto.password !== undefined) {
      user.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
      user.refreshToken = null;
    }
    return this.mapEmployee(await this.repo.save(user));
  }

  async remove(tenantId: string, id: string) {
    const user = await this.repo.findOneBy({ id, tenantId });
    if (!user) throw new NotFoundException('Funcionário não encontrado');
    if (user.role === UserRole.PROPRIETARIO) {
      throw new ForbiddenException('Não é possível remover o proprietário');
    }
    await this.repo.remove(user);
  }

  private mapEmployee(u: User) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      document: u.document ?? '',
      createdAt: u.createdAt.toISOString().split('T')[0],
    };
  }
}
