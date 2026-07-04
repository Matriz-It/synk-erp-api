import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { ListServicesDto } from './dto/list-services.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly repo: Repository<Service>,
  ) {}

  async list(tenantId: string, query: ListServicesDto) {
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.tenant_id = :tenantId', { tenantId });

    if (query.search) {
      qb.andWhere(
        '(LOWER(s.nome) LIKE :search OR LOWER(s.codigo) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    switch (query.status) {
      case 'ativo':   qb.andWhere('s.ativo = true'); break;
      case 'inativo': qb.andWhere('s.ativo = false'); break;
    }

    const col = query.sortBy === 'preco' ? 's.preco' : 's.nome';
    qb.orderBy(col, query.sortDir === 'desc' ? 'DESC' : 'ASC');

    const services = await qb.getMany();
    return services.map((s) => this.mapService(s));
  }

  async create(tenantId: string, dto: CreateServiceDto) {
    const codigo = dto.codigo.toUpperCase().trim();
    const exists = await this.repo.findOneBy({ codigo, tenantId });
    if (exists) throw new ConflictException('Código já cadastrado');

    const service = await this.repo.save(
      this.repo.create({
        codigo,
        nome: dto.nome.trim(),
        descricao: dto.descricao?.trim() || null,
        preco: dto.preco,
        precoCusto: dto.precoCusto ?? null,
        ativo: dto.ativo ?? true,
        tenantId,
      }),
    );

    return this.mapService(service);
  }

  async findOne(id: string, tenantId: string) {
    const service = await this.repo.findOneBy({ id, tenantId });
    if (!service) throw new NotFoundException('Serviço não encontrado');
    return this.mapService(service);
  }

  async update(id: string, tenantId: string, dto: UpdateServiceDto) {
    const service = await this.repo.findOneBy({ id, tenantId });
    if (!service) throw new NotFoundException('Serviço não encontrado');

    if (dto.codigo) {
      const codigo = dto.codigo.toUpperCase().trim();
      if (codigo !== service.codigo) {
        const exists = await this.repo.findOneBy({ codigo, tenantId });
        if (exists) throw new ConflictException('Código já cadastrado');
      }
      dto.codigo = codigo;
    }

    Object.assign(service, dto);
    const saved = await this.repo.save(service);
    return this.mapService(saved);
  }

  private mapService(s: Service) {
    return {
      id: s.id,
      codigo: s.codigo,
      nome: s.nome,
      descricao: s.descricao,
      preco: s.preco,
      precoCusto: s.precoCusto,
      ativo: s.ativo,
      criadoEm: s.createdAt.toISOString().split('T')[0],
    };
  }
}
