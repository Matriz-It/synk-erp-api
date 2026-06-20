import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
      .andWhere('user.role IN (:...roles)', {
        roles: [UserRole.PROPRIETARIO, UserRole.ADMIN],
      })
      .orderBy(
        `CASE user.role WHEN 'proprietario' THEN 1 ELSE 2 END`,
        'ASC',
      )
      .getOne();
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.repo.update(id, { refreshToken });
  }

  async updateProfile(
    id: string,
    data: { name?: string; document?: string },
  ): Promise<User> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (data.name !== undefined) user.name = data.name.trim();
    if (data.document !== undefined)
      user.document = data.document ? data.document.replace(/\D/g, '') : null;
    return this.repo.save(user);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.repo.update(id, { password: hashedPassword, refreshToken: null });
  }
}
