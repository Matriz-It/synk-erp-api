import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NFeStatus } from '../../core/enums/enums';
import { Client } from '../clients/entities/client.entity';
import { CreateNfeDto } from './dto/create-nfe.dto';
import { ListNfesDto } from './dto/list-nfes.dto';
import { UpdateNfeDto } from './dto/update-nfe.dto';
import { NfeItem } from './entities/nfe-item.entity';
import { NfeVencimento } from './entities/nfe-vencimento.entity';
import { Nfe } from './entities/nfe.entity';

@Injectable()
export class NfeService {
  constructor(
    @InjectRepository(Nfe)
    private readonly nfeRepo: Repository<Nfe>,
    @InjectRepository(NfeItem)
    private readonly itemRepo: Repository<NfeItem>,
    @InjectRepository(NfeVencimento)
    private readonly vencRepo: Repository<NfeVencimento>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  async list(tenantId: string, query: ListNfesDto) {
    const qb = this.nfeRepo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.client', 'client')
      .where('n.tenant_id = :tenantId', { tenantId })
      .orderBy('n.numero', 'DESC');

    if (query.status) {
      qb.andWhere('n.status = :status', { status: query.status });
    }

    if (query.search) {
      const q = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        "(LOWER(client.razaoSocial) LIKE :q OR CAST(n.numero AS TEXT) LIKE :q OR LOWER(client.cnpj) LIKE :q)",
        { q },
      );
    }

    const nfes = await qb.getMany();
    return nfes.map((n) => this.mapNfe(n));
  }

  async create(tenantId: string, dto: CreateNfeDto) {
    const client = await this.clientRepo.findOneBy({ id: dto.clientId, tenantId });
    if (!client) throw new NotFoundException('Cliente não encontrado');

    const result = await this.nfeRepo.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS next FROM nfes WHERE tenant_id = $1`,
      [tenantId],
    );
    const numero = parseInt(result[0].next as string, 10);

    const nfe = await this.nfeRepo.save(
      this.nfeRepo.create({
        numero,
        serie: dto.serie ?? '1',
        dataEmissao: dto.dataEmissao,
        dataSaida: dto.dataSaida ?? null,
        naturezaOperacao: dto.naturezaOperacao,
        finalidade: dto.finalidade,
        clientId: dto.clientId,
        status: dto.status ?? NFeStatus.RASCUNHO,
        baseICMS: dto.baseICMS ?? 0,
        valorICMS: dto.valorICMS ?? 0,
        baseIBS: dto.baseIBS ?? 0,
        valorIBS: dto.valorIBS ?? 0,
        valorCBS: dto.valorCBS ?? 0,
        valorFrete: dto.valorFrete ?? 0,
        valorSeguro: dto.valorSeguro ?? 0,
        valorDesconto: dto.valorDesconto ?? 0,
        valorOutro: dto.valorOutro ?? 0,
        valorTotal: dto.valorTotal ?? 0,
        modalidadeFrete: dto.modalidadeFrete,
        transportadora: dto.transportadora?.trim() || null,
        placaVeiculo: dto.placaVeiculo?.trim() || null,
        pesoLiquido: dto.pesoLiquido ?? null,
        pesoBruto: dto.pesoBruto ?? null,
        qtdVolumes: dto.qtdVolumes ?? null,
        especieVolumes: dto.especieVolumes?.trim() || null,
        obsContribuinte: dto.obsContribuinte?.trim() || null,
        obsFisco: dto.obsFisco?.trim() || null,
        numeroPedido: dto.numeroPedido?.trim() || null,
        numeroContrato: dto.numeroContrato?.trim() || null,
        tenantId,
      }),
    );

    nfe.items = await Promise.all(
      dto.items.map((item) =>
        this.itemRepo.save(
          this.itemRepo.create({
            nfeId: nfe.id,
            produtoId: item.produtoId ?? null,
            sku: item.sku,
            nome: item.nome,
            qtd: item.qtd,
            preco: item.preco,
            desconto: item.desconto ?? 0,
            cfop: item.cfop,
            cst: item.cst,
            bcICMS: item.bcICMS ?? 0,
            aliqICMS: item.aliqICMS ?? 0,
            valorICMS: item.valorICMS ?? 0,
          }),
        ),
      ),
    );

    nfe.vencimentos = await Promise.all(
      (dto.vencimentos ?? []).map((v) =>
        this.vencRepo.save(
          this.vencRepo.create({
            nfeId: nfe.id,
            data: v.data,
            valor: v.valor,
            obs: v.obs?.trim() || null,
          }),
        ),
      ),
    );

    nfe.client = client;
    return this.mapNfe(nfe, true);
  }

  async findOne(id: string, tenantId: string) {
    const nfe = await this.nfeRepo.findOne({
      where: { id, tenantId },
      relations: ['client', 'items', 'vencimentos'],
    });
    if (!nfe) throw new NotFoundException('NF-e não encontrada');
    return this.mapNfe(nfe, true);
  }

  async update(id: string, tenantId: string, dto: UpdateNfeDto) {
    const nfe = await this.nfeRepo.findOneBy({ id, tenantId });
    if (!nfe) throw new NotFoundException('NF-e não encontrada');
    if (nfe.status !== NFeStatus.RASCUNHO) {
      throw new BadRequestException('Apenas NF-e em rascunho podem ser editadas');
    }

   

    Object.assign(nfe, {
      ...(dto.serie !== undefined && { serie: dto.serie }),
      ...(dto.dataEmissao !== undefined && { dataEmissao: dto.dataEmissao }),
      ...(dto.dataSaida !== undefined && { dataSaida: dto.dataSaida }),
      ...(dto.naturezaOperacao !== undefined && { naturezaOperacao: dto.naturezaOperacao }),
      ...(dto.finalidade !== undefined && { finalidade: dto.finalidade }),
      ...(dto.clientId !== undefined && { clientId: dto.clientId }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.baseICMS !== undefined && { baseICMS: dto.baseICMS }),
      ...(dto.valorICMS !== undefined && { valorICMS: dto.valorICMS }),
      ...(dto.baseIBS !== undefined && { baseIBS: dto.baseIBS }),
      ...(dto.valorIBS !== undefined && { valorIBS: dto.valorIBS }),
      ...(dto.valorCBS !== undefined && { valorCBS: dto.valorCBS }),
      ...(dto.valorFrete !== undefined && { valorFrete: dto.valorFrete }),
      ...(dto.valorSeguro !== undefined && { valorSeguro: dto.valorSeguro }),
      ...(dto.valorDesconto !== undefined && { valorDesconto: dto.valorDesconto }),
      ...(dto.valorOutro !== undefined && { valorOutro: dto.valorOutro }),
      ...(dto.valorTotal !== undefined && { valorTotal: dto.valorTotal }),
      ...(dto.modalidadeFrete !== undefined && { modalidadeFrete: dto.modalidadeFrete }),
      ...(dto.transportadora !== undefined && { transportadora: dto.transportadora?.trim() || null }),
      ...(dto.placaVeiculo !== undefined && { placaVeiculo: dto.placaVeiculo?.trim() || null }),
      ...(dto.pesoLiquido !== undefined && { pesoLiquido: dto.pesoLiquido }),
      ...(dto.pesoBruto !== undefined && { pesoBruto: dto.pesoBruto }),
      ...(dto.qtdVolumes !== undefined && { qtdVolumes: dto.qtdVolumes }),
      ...(dto.especieVolumes !== undefined && { especieVolumes: dto.especieVolumes?.trim() || null }),
      ...(dto.obsContribuinte !== undefined && { obsContribuinte: dto.obsContribuinte?.trim() || null }),
      ...(dto.obsFisco !== undefined && { obsFisco: dto.obsFisco?.trim() || null }),
      ...(dto.numeroPedido !== undefined && { numeroPedido: dto.numeroPedido?.trim() || null }),
      ...(dto.numeroContrato !== undefined && { numeroContrato: dto.numeroContrato?.trim() || null }),
    });

    const saved = await this.nfeRepo.save(nfe);

    if (dto.items) {
      await this.itemRepo.delete({ nfeId: id });
      saved.items = await Promise.all(
        dto.items.map((item) =>
          this.itemRepo.save(
            this.itemRepo.create({
              nfeId: id,
              produtoId: item.produtoId ?? null,
              sku: item.sku,
              nome: item.nome,
              qtd: item.qtd,
              preco: item.preco,
              desconto: item.desconto ?? 0,
              cfop: item.cfop,
              cst: item.cst,
              bcICMS: item.bcICMS ?? 0,
              aliqICMS: item.aliqICMS ?? 0,
              valorICMS: item.valorICMS ?? 0,
            }),
          ),
        ),
      );
    } else {
      saved.items = await this.itemRepo.findBy({ nfeId: id });
    }

    if (dto.vencimentos) {
      await this.vencRepo.delete({ nfeId: id });
      saved.vencimentos = await Promise.all(
        dto.vencimentos.map((v) =>
          this.vencRepo.save(
            this.vencRepo.create({
              nfeId: id,
              data: v.data,
              valor: v.valor,
              obs: v.obs?.trim() || null,
            }),
          ),
        ),
      );
    } else {
      saved.vencimentos = await this.vencRepo.findBy({ nfeId: id });
    }

    saved.client = (await this.clientRepo.findOneBy({ id: saved.clientId })) as Client;
    return this.mapNfe(saved, true);
  }

  async remove(id: string, tenantId: string) {
    const nfe = await this.nfeRepo.findOneBy({ id, tenantId });
    if (!nfe) throw new NotFoundException('NF-e não encontrada');
    if (nfe.status !== NFeStatus.RASCUNHO) {
      throw new BadRequestException('Apenas NF-e em rascunho podem ser excluídas');
    }
    await this.nfeRepo.remove(nfe);
  }

  private mapNfe(nfe: Nfe, withDetails = false) {
    const base = {
      id: nfe.id,
      numero: nfe.numero,
      serie: nfe.serie,
      dataEmissao: nfe.dataEmissao,
      dataSaida: nfe.dataSaida ?? null,
      naturezaOperacao: nfe.naturezaOperacao,
      finalidade: nfe.finalidade,
      clienteId: nfe.clientId,
      cliente: nfe.client?.razaoSocial ?? '',
      clienteCnpj: nfe.client?.documento ?? '',
      status: nfe.status,
      chaveAcesso: nfe.chaveAcesso ?? null,
      protocolo: nfe.protocolo ?? null,
      valorTotal: nfe.valorTotal,
      criadoEm: nfe.createdAt?.toISOString().split('T')[0] ?? '',
    };

    if (!withDetails) return base;

    return {
      ...base,
      baseICMS: nfe.baseICMS,
      valorICMS: nfe.valorICMS,
      baseIBS: nfe.baseIBS,
      valorIBS: nfe.valorIBS,
      valorCBS: nfe.valorCBS,
      valorFrete: nfe.valorFrete,
      valorSeguro: nfe.valorSeguro,
      valorDesconto: nfe.valorDesconto,
      valorOutro: nfe.valorOutro,
      modalidadeFrete: nfe.modalidadeFrete,
      transportadora: nfe.transportadora ?? null,
      placaVeiculo: nfe.placaVeiculo ?? null,
      pesoLiquido: nfe.pesoLiquido ?? null,
      pesoBruto: nfe.pesoBruto ?? null,
      qtdVolumes: nfe.qtdVolumes ?? null,
      especieVolumes: nfe.especieVolumes ?? null,
      obsContribuinte: nfe.obsContribuinte ?? null,
      obsFisco: nfe.obsFisco ?? null,
      numeroPedido: nfe.numeroPedido ?? null,
      numeroContrato: nfe.numeroContrato ?? null,
      items: (nfe.items ?? []).map((i) => ({
        id: i.id,
        produtoId: i.produtoId ?? null,
        sku: i.sku,
        nome: i.nome,
        qtd: i.qtd,
        preco: i.preco,
        desconto: i.desconto,
        cfop: i.cfop,
        cst: i.cst,
        bcICMS: i.bcICMS,
        aliqICMS: i.aliqICMS,
        valorICMS: i.valorICMS,
        total: i.preco * i.qtd - i.desconto,
      })),
      vencimentos: (nfe.vencimentos ?? []).map((v) => ({
        id: v.id,
        data: v.data,
        valor: v.valor,
        obs: v.obs ?? null,
      })),
    };
  }
}
