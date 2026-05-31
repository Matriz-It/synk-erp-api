import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteTipo } from '../../core/enums/enums';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersDto } from './dto/list-suppliers.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly repo: Repository<Supplier>,
  ) {}

  async list(tenantId: string, query: ListSuppliersDto) {
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.tenant_id = :tenantId', { tenantId })
      .orderBy('s.razaoSocial', 'ASC');

    if (query.search) {
      const q = query.search.toLowerCase();
      qb.andWhere(
        "(LOWER(s.razaoSocial) LIKE :q OR LOWER(s.email) LIKE :q OR LOWER(s.nomeFantasia) LIKE :q OR REGEXP_REPLACE(s.documento, '[^0-9]', '', 'g') LIKE :qDoc)",
        { q: `%${q}%`, qDoc: `%${query.search.replace(/\D/g, '')}%` },
      );
    }

    if (query.tipo) qb.andWhere('s.tipo = :tipo', { tipo: query.tipo });
    if (query.status === 'ativo')   qb.andWhere('s.ativo = true');
    if (query.status === 'inativo') qb.andWhere('s.ativo = false');

    return (await qb.getMany()).map(s => this.mapSupplier(s));
  }

  async create(tenantId: string, dto: CreateSupplierDto) {
    const docNorm = dto.documento.replace(/\D/g, '');
    const exists = await this.repo.findOneBy({ documento: docNorm, tenantId });
    if (exists) throw new ConflictException('CPF/CNPJ já cadastrado para este fornecedor');

    const supplier = await this.repo.save(
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
    return this.mapSupplier(supplier);
  }

  async findOne(id: string, tenantId: string) {
    const s = await this.repo.findOneBy({ id, tenantId });
    if (!s) throw new NotFoundException('Fornecedor não encontrado');
    return this.mapSupplier(s);
  }

  async update(id: string, tenantId: string, dto: UpdateSupplierDto) {
    const supplier = await this.repo.findOneBy({ id, tenantId });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');

    if (dto.documento) {
      const docNorm = dto.documento.replace(/\D/g, '');
      if (docNorm !== supplier.documento) {
        const exists = await this.repo.findOneBy({ documento: docNorm, tenantId });
        if (exists) throw new ConflictException('CPF/CNPJ já cadastrado');
      }
      dto.documento = docNorm;
    }

    const updated = Object.assign(supplier, {
      ...dto,
      nomeFantasia: dto.nomeFantasia !== undefined ? (dto.nomeFantasia.trim() || null) : supplier.nomeFantasia,
      email: dto.email !== undefined ? (dto.email.trim() || null) : supplier.email,
      telefone: dto.telefone !== undefined ? (dto.telefone || null) : supplier.telefone,
      complemento: dto.complemento !== undefined ? (dto.complemento.trim() || null) : supplier.complemento,
    });

    return this.mapSupplier(await this.repo.save(updated));
  }

  async remove(id: string, tenantId: string) {
    const supplier = await this.repo.findOneBy({ id, tenantId });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');
    await this.repo.remove(supplier);
  }

  private mapSupplier(s: Supplier) {
    return {
      id: s.id,
      tipo: s.tipo,
      razaoSocial: s.razaoSocial,
      nomeFantasia: s.nomeFantasia ?? '',
      documento: this.formatDoc(s.documento, s.tipo),
      email: s.email ?? '',
      telefone: s.telefone ?? '',
      ativo: s.ativo,
      cep: s.cep,
      logradouro: s.logradouro,
      numero: s.numero,
      complemento: s.complemento ?? '',
      bairro: s.bairro,
      cidade: s.cidade,
      uf: s.uf,
      criadoEm: s.createdAt.toISOString().split('T')[0],
      totalPedidos: 0,
      totalGasto: 0,
    };
  }

  private formatDoc(doc: string, tipo: ClienteTipo): string {
    const d = doc.replace(/\D/g, '');
    if (tipo === ClienteTipo.PF)
      return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
}
