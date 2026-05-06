import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteTipo } from '../../core/enums/enums';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsDto } from './dto/list-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly repo: Repository<Client>,
  ) {}

  async list(tenantId: string, query: ListClientsDto) {
    const qb = this.repo
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId });

    if (query.search) {
      const q = query.search.toLowerCase();
      qb.andWhere(
        '(LOWER(c.razaoSocial) LIKE :q OR LOWER(c.email) LIKE :q OR LOWER(c.nomeFantasia) LIKE :q OR REGEXP_REPLACE(c.documento, \'[^0-9]\', \'\', \'g\') LIKE :qDoc)',
        { q: `%${q}%`, qDoc: `%${query.search.replace(/\D/g, '')}%` },
      );
    }

    if (query.tipo) qb.andWhere('c.tipo = :tipo', { tipo: query.tipo });
    if (query.status === 'ativo') qb.andWhere('c.ativo = true');
    if (query.status === 'inativo') qb.andWhere('c.ativo = false');

    qb.orderBy('c.razaoSocial', 'ASC');

    const clients = await qb.getMany();
    return clients.map((c) => this.mapClient(c));
  }

  async create(tenantId: string, dto: CreateClientDto) {
    const docNorm = dto.documento.replace(/\D/g, '');
    const exists = await this.repo.findOneBy({ documento: docNorm, tenantId });
    if (exists) throw new ConflictException('CPF/CNPJ já cadastrado');

    const client = await this.repo.save(
      this.repo.create({
        tipo: dto.tipo,
        razaoSocial: dto.razaoSocial.trim(),
        nomeFantasia: dto.nomeFantasia?.trim() || null,
        documento: docNorm,
        email: dto.email?.trim() || null,
        telefone: dto.telefone || null,
        ativo: dto.ativo ?? true,
        cep: dto.cep,
        logradouro: dto.logradouro.trim(),
        numero: dto.numero.trim(),
        complemento: dto.complemento?.trim() || null,
        bairro: dto.bairro.trim(),
        cidade: dto.cidade.trim(),
        uf: dto.uf.toUpperCase(),
        tenantId,
      }),
    );
    return this.mapClient(client);
  }

  async findOne(id: string, tenantId: string) {
    const client = await this.repo.findOneBy({ id, tenantId });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return this.mapClient(client);
  }

  async update(id: string, tenantId: string, dto: UpdateClientDto) {
    const client = await this.repo.findOneBy({ id, tenantId });
    if (!client) throw new NotFoundException('Cliente não encontrado');

    if (dto.documento) {
      const docNorm = dto.documento.replace(/\D/g, '');
      if (docNorm !== client.documento) {
        const exists = await this.repo.findOneBy({ documento: docNorm, tenantId });
        if (exists) throw new ConflictException('CPF/CNPJ já cadastrado');
      }
      dto.documento = docNorm;
    }

    const updated = Object.assign(client, {
      ...dto,
      nomeFantasia: dto.nomeFantasia !== undefined ? (dto.nomeFantasia.trim() || null) : client.nomeFantasia,
      email: dto.email !== undefined ? (dto.email.trim() || null) : client.email,
      telefone: dto.telefone !== undefined ? (dto.telefone || null) : client.telefone,
      complemento: dto.complemento !== undefined ? (dto.complemento.trim() || null) : client.complemento,
    });

    return this.mapClient(await this.repo.save(updated));
  }

  async remove(id: string, tenantId: string) {
    const client = await this.repo.findOneBy({ id, tenantId });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    await this.repo.remove(client);
  }

  private mapClient(c: Client) {
    return {
      id: c.id,
      tipo: c.tipo,
      razaoSocial: c.razaoSocial,
      nomeFantasia: c.nomeFantasia ?? '',
      documento: this.formatDoc(c.documento, c.tipo),
      email: c.email ?? '',
      telefone: c.telefone ?? '',
      ativo: c.ativo,
      cep: c.cep,
      logradouro: c.logradouro,
      numero: c.numero,
      complemento: c.complemento ?? '',
      bairro: c.bairro,
      cidade: c.cidade,
      uf: c.uf,
      criadoEm: c.createdAt.toISOString().split('T')[0],
      totalPedidos: c.totalPedidos,
      totalGasto: c.totalGasto,
    };
  }

  private formatDoc(doc: string, tipo: ClienteTipo): string {
    const d = doc.replace(/\D/g, '');
    if (tipo === ClienteTipo.PF) {
      return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
}
