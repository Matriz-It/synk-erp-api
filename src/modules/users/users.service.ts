import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../core/enums/enums';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    document?: string;
    tenantId: string;
  }): Promise<User> {
    const existing = await this.repo.findOneBy({ email: data.email });
    if (existing) throw new ConflictException('E-mail já cadastrado');
    return this.repo.save(
      this.repo.create({
        ...data,
        document: data.document ? data.document.replace(/\D/g, '') : undefined,
      }),
    );
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  findByDocument(document: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .where("REGEXP_REPLACE(user.document, '[^0-9]', '', 'g') = :document", { document })
      .getOne();
  }

  findAdminByTenantDocument(cnpj: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .innerJoin('user.tenant', 'tenant')
      .where("REGEXP_REPLACE(tenant.document, '[^0-9]', '', 'g') = :cnpj", { cnpj })
      .andWhere('user.role = :role', { role: UserRole.ADMIN })
      .getOne();
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.repo.update(id, { refreshToken });
  }
}
