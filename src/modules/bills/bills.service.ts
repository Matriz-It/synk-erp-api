import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceStatus } from '../../core/enums/enums';
import { CreateBillDto } from './dto/create-bill.dto';
import { ListBillsDto } from './dto/list-bills.dto';
import { PayBillDto } from './dto/pay-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { Bill } from './entities/bill.entity';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private readonly repo: Repository<Bill>,
  ) {}

  async list(tenantId: string, query: ListBillsDto) {
    const today = new Date().toISOString().split('T')[0];
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const qb = this.repo
      .createQueryBuilder('b')
      .where('b.tenant_id = :tenantId', { tenantId })
      .orderBy(
        `CASE b.status
          WHEN 'aberto' THEN CASE WHEN b.vencimento < :today THEN 1 WHEN b.vencimento <= :sevenDays THEN 2 ELSE 3 END
          WHEN 'pago' THEN 4
          ELSE 5 END`,
        'ASC',
      )
      .addOrderBy('b.vencimento', 'ASC')
      .setParameters({ today, sevenDays });

    if (query.search) {
      const q = query.search.toLowerCase();
      qb.andWhere(
        '(LOWER(b.parceiro) LIKE :q OR LOWER(b.descricao) LIKE :q OR CAST(b.numero AS TEXT) LIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (query.status) {
      switch (query.status) {
        case 'pago':
          qb.andWhere('b.status = :st', { st: FinanceStatus.PAGO }); break;
        case 'vencido':
          qb.andWhere("b.status = 'aberto' AND b.vencimento < :today"); break;
        case 'vencendo':
          qb.andWhere("b.status = 'aberto' AND b.vencimento >= :today AND b.vencimento <= :sevenDays"); break;
        case 'aberto':
          qb.andWhere("b.status = 'aberto' AND b.vencimento > :sevenDays"); break;
      }
    }

    const bills = await qb.getMany();
    return bills.map(b => this.mapBill(b));
  }

  async create(tenantId: string, dto: CreateBillDto) {
    const bill = await this.repo.save(
      this.repo.create({
        numero: await this.nextNumero(tenantId),
        parceiro: dto.parceiro.trim(),
        descricao: dto.descricao.trim(),
        valor: dto.valor,
        vencimento: dto.vencimento,
        status: dto.status ?? FinanceStatus.ABERTO,
        categoria: dto.categoria?.trim() || null,
        obs: dto.obs?.trim() || null,
        fixa: dto.fixa ?? false,
        tenantId,
      }),
    );
    return this.mapBill(bill);
  }

  private async nextNumero(tenantId: string): Promise<number> {
    const result = await this.repo.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS next FROM bills WHERE tenant_id = $1`,
      [tenantId],
    );
    return parseInt(result[0].next, 10);
  }

  async findOne(id: string, tenantId: string) {
    const bill = await this.repo.findOneBy({ id, tenantId });
    if (!bill) throw new NotFoundException('Conta não encontrada');
    return this.mapBill(bill);
  }

  async update(id: string, tenantId: string, dto: UpdateBillDto) {
    const bill = await this.repo.findOneBy({ id, tenantId });
    if (!bill) throw new NotFoundException('Conta não encontrada');
    if (dto.parceiro !== undefined) bill.parceiro = dto.parceiro.trim();
    if (dto.descricao !== undefined) bill.descricao = dto.descricao.trim();
    if (dto.valor !== undefined) bill.valor = dto.valor;
    if (dto.vencimento !== undefined) bill.vencimento = dto.vencimento;
    if (dto.status !== undefined) bill.status = dto.status;
    if (dto.categoria !== undefined) bill.categoria = dto.categoria?.trim() || null;
    if (dto.obs !== undefined) bill.obs = dto.obs?.trim() || null;
    if (dto.fixa !== undefined) bill.fixa = dto.fixa;
    return this.mapBill(await this.repo.save(bill));
  }

  async pay(id: string, tenantId: string, dto: PayBillDto) {
    const bill = await this.repo.findOneBy({ id, tenantId });
    if (!bill) throw new NotFoundException('Conta não encontrada');
    const jaEstaPaga = bill.status === FinanceStatus.PAGO;
    bill.status = FinanceStatus.PAGO;
    bill.pagoEm = dto.pagoEm ?? new Date().toISOString().split('T')[0];
    bill.valorPago = dto.valorPago ?? bill.valor;
    const paga = await this.repo.save(bill);

    // Conta fixa: ao baixar, gera automaticamente a ocorrência do mês seguinte
    let proxima: Bill | null = null;
    if (bill.fixa && !jaEstaPaga) {
      proxima = await this.repo.save(
        this.repo.create({
          numero: await this.nextNumero(tenantId),
          parceiro: bill.parceiro,
          descricao: bill.descricao,
          valor: bill.valor,
          vencimento: this.addOneMonth(bill.vencimento),
          status: FinanceStatus.ABERTO,
          categoria: bill.categoria,
          obs: bill.obs,
          fixa: true,
          tenantId,
        }),
      );
    }

    return {
      ...this.mapBill(paga),
      ...(proxima ? { proxima: this.mapBill(proxima) } : {}),
    };
  }

  /** Soma 1 mês a uma data YYYY-MM-DD, ajustando o dia ao fim do mês (31/01 → 28/02). */
  private addOneMonth(vencimento: string): string {
    const [y, m, d] = vencimento.split('-').map(Number);
    const nextY = m === 12 ? y + 1 : y;
    const nextM = m === 12 ? 1 : m + 1;
    const lastDay = new Date(nextY, nextM, 0).getDate();
    const day = Math.min(d, lastDay);
    return `${nextY}-${String(nextM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  async remove(id: string, tenantId: string) {
    const bill = await this.repo.findOneBy({ id, tenantId });
    if (!bill) throw new NotFoundException('Conta não encontrada');
    await this.repo.remove(bill);
  }

  private mapBill(b: Bill) {
    return {
      id: b.id,
      numero: b.numero,
      parceiro: b.parceiro,
      descricao: b.descricao,
      valor: b.valor,
      vencimento: b.vencimento,
      status: this.computeStatus(b.status, b.vencimento),
      categoria: b.categoria ?? '',
      obs: b.obs ?? '',
      fixa: b.fixa,
      pagoEm: b.pagoEm ?? undefined,
      valorPago: b.valorPago ?? undefined,
      criadoEm: b.createdAt.toISOString().split('T')[0],
    };
  }

  private computeStatus(stored: FinanceStatus, vencimento: string): string {
    if (stored === FinanceStatus.PAGO) return 'pago';
    if (stored === FinanceStatus.CANCELADO) return 'cancelado';
    const today = new Date().toISOString().split('T')[0];
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (vencimento < today) return 'vencido';
    if (vencimento <= sevenDays) return 'vencendo';
    return 'aberto';
  }
}
