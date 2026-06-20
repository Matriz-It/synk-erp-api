import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceStatus } from '../../core/enums/enums';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { ListReceivablesDto } from './dto/list-receivables.dto';
import { ReceiveReceivableDto } from './dto/receive-receivable.dto';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { Receivable } from './entities/receivable.entity';

@Injectable()
export class ReceivablesService {
  constructor(
    @InjectRepository(Receivable)
    private readonly repo: Repository<Receivable>,
  ) {}

  async list(tenantId: string, query: ListReceivablesDto) {
    const today = new Date().toISOString().split('T')[0];
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const qb = this.repo
      .createQueryBuilder('r')
      .where('r.tenant_id = :tenantId', { tenantId })
      .orderBy(
        `CASE r.status
          WHEN 'aberto' THEN CASE WHEN r.vencimento < :today THEN 1 WHEN r.vencimento <= :sevenDays THEN 2 ELSE 3 END
          WHEN 'pago' THEN 4
          ELSE 5 END`,
        'ASC',
      )
      .addOrderBy('r.vencimento', 'ASC')
      .setParameters({ today, sevenDays });

    if (query.search) {
      const q = query.search.toLowerCase();
      qb.andWhere(
        '(LOWER(r.parceiro) LIKE :q OR LOWER(r.descricao) LIKE :q OR CAST(r.numero AS TEXT) LIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (query.status) {
      switch (query.status) {
        case 'pago':
          qb.andWhere('r.status = :st', { st: FinanceStatus.PAGO });
          break;
        case 'vencido':
          qb.andWhere("r.status = 'aberto' AND r.vencimento < :today");
          break;
        case 'vencendo':
          qb.andWhere(
            "r.status = 'aberto' AND r.vencimento >= :today AND r.vencimento <= :sevenDays",
          );
          break;
        case 'aberto':
          qb.andWhere("r.status = 'aberto' AND r.vencimento > :sevenDays");
          break;
      }
    }

    return (await qb.getMany()).map((r) => this.mapReceivable(r));
  }

  async create(tenantId: string, dto: CreateReceivableDto) {
    const result = await this.repo.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS next FROM receivables WHERE tenant_id = $1`,
      [tenantId],
    );
    const numero = parseInt(result[0].next, 10);

    const rec = await this.repo.save(
      this.repo.create({
        numero,
        parceiro: dto.parceiro.trim(),
        descricao: dto.descricao.trim(),
        valor: dto.valor,
        vencimento: dto.vencimento,
        status: dto.status ?? FinanceStatus.ABERTO,
        categoria: dto.categoria?.trim() || null,
        obs: dto.obs?.trim() || null,
        tenantId,
      }),
    );
    return this.mapReceivable(rec);
  }

  async findOne(id: string, tenantId: string) {
    const rec = await this.repo.findOneBy({ id, tenantId });
    if (!rec) throw new NotFoundException('Conta a receber não encontrada');
    return this.mapReceivable(rec);
  }

  async update(id: string, tenantId: string, dto: UpdateReceivableDto) {
    const rec = await this.repo.findOneBy({ id, tenantId });
    if (!rec) throw new NotFoundException('Conta a receber não encontrada');
    if (dto.parceiro !== undefined) rec.parceiro = dto.parceiro.trim();
    if (dto.descricao !== undefined) rec.descricao = dto.descricao.trim();
    if (dto.valor !== undefined) rec.valor = dto.valor;
    if (dto.vencimento !== undefined) rec.vencimento = dto.vencimento;
    if (dto.status !== undefined) rec.status = dto.status;
    if (dto.categoria !== undefined)
      rec.categoria = dto.categoria?.trim() || null;
    if (dto.obs !== undefined) rec.obs = dto.obs?.trim() || null;
    return this.mapReceivable(await this.repo.save(rec));
  }

  async receive(id: string, tenantId: string, dto: ReceiveReceivableDto) {
    const rec = await this.repo.findOneBy({ id, tenantId });
    if (!rec) throw new NotFoundException('Conta a receber não encontrada');
    rec.status = FinanceStatus.PAGO;
    rec.pagoEm = dto.pagoEm ?? new Date().toISOString().split('T')[0];
    rec.valorPago = dto.valorPago ?? rec.valor;
    return this.mapReceivable(await this.repo.save(rec));
  }

  async remove(id: string, tenantId: string) {
    const rec = await this.repo.findOneBy({ id, tenantId });
    if (!rec) throw new NotFoundException('Conta a receber não encontrada');
    await this.repo.remove(rec);
  }

  private mapReceivable(r: Receivable) {
    return {
      id: r.id,
      numero: r.numero,
      parceiro: r.parceiro,
      descricao: r.descricao,
      valor: r.valor,
      vencimento: r.vencimento,
      status: this.computeStatus(r.status, r.vencimento),
      categoria: r.categoria ?? '',
      obs: r.obs ?? '',
      pagoEm: r.pagoEm ?? undefined,
      valorPago: r.valorPago ?? undefined,
      criadoEm: r.createdAt.toISOString().split('T')[0],
    };
  }

  private computeStatus(stored: FinanceStatus, vencimento: string): string {
    if (stored === FinanceStatus.PAGO) return 'pago';
    if (stored === FinanceStatus.CANCELADO) return 'cancelado';
    const today = new Date().toISOString().split('T')[0];
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    if (vencimento < today) return 'vencido';
    if (vencimento <= sevenDays) return 'vencendo';
    return 'aberto';
  }
}
