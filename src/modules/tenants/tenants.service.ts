import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantSegment } from '../../core/enums/enums';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  async create(name: string, document?: string, segmento?: TenantSegment): Promise<Tenant> {
    const normalized = document ? document.replace(/\D/g, '') : null;
    if (normalized) {
      const existing = await this.repo.findOneBy({ document: normalized });
      if (existing) throw new ConflictException('CNPJ já cadastrado');
    }
    return this.repo.save(this.repo.create({ name, document: normalized, segmento: segmento ?? null }));
  }

  findById(id: string): Promise<Tenant | null> {
    return this.repo.findOneBy({ id });
  }

  async updateSegmento(id: string, segmento: TenantSegment): Promise<void> {
    await this.repo.update({ id }, { segmento });
  }
}
