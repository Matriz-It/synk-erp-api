import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceStatus, OrderStatus } from '../../core/enums/enums';
import { Bill } from '../bills/entities/bill.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Receivable } from '../receivables/entities/receivable.entity';
import { GetCashflowDto } from './dto/get-cashflow.dto';

export interface LancamentoCaixa {
  id: string;
  data: string;
  descricao: string;
  origem: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  categoria: string;
}

@Injectable()
export class CashflowService {
  constructor(
    @InjectRepository(Receivable)
    private readonly receivableRepo: Repository<Receivable>,
    @InjectRepository(Bill)
    private readonly billRepo: Repository<Bill>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  async getCashflow(tenantId: string, dto: GetCashflowDto) {
    const mes = dto.mes ?? new Date().toISOString().slice(0, 7);

    // Busca todas as fontes de entrada/saída pagas do tenant
    const [receivables, bills, orders] = await Promise.all([
      this.receivableRepo
        .createQueryBuilder('r')
        .where('r.tenant_id = :tenantId', { tenantId })
        .andWhere(`r.status = '${FinanceStatus.PAGO}'`)
        .andWhere('r.recebido_em IS NOT NULL')
        .getMany(),

      this.billRepo
        .createQueryBuilder('b')
        .where('b.tenant_id = :tenantId', { tenantId })
        .andWhere(`b.status = '${FinanceStatus.PAGO}'`)
        .andWhere('b.pago_em IS NOT NULL')
        .getMany(),

      this.orderRepo
        .createQueryBuilder('o')
        .leftJoinAndSelect('o.items', 'items')
        .leftJoinAndSelect('o.client', 'client')
        .where('o.tenant_id = :tenantId', { tenantId })
        .andWhere(`o.status = '${OrderStatus.CONCLUIDO}'`)
        .andWhere('o.concluido_em IS NOT NULL')
        .getMany(),
    ]);

    // Converte para formato unificado
    const all: LancamentoCaixa[] = [
      ...orders.map((o) => {
        const subtotal = (o.items ?? []).reduce((acc, i) => acc + i.preco * i.qtd - i.desconto, 0);
        const total = Math.max(0, subtotal - o.descontoGlobal);
        return {
          id: o.id,
          data: o.concluidoEm!,
          descricao: `Venda direta — ${o.client?.razaoSocial ?? 'Cliente'}`,
          origem: `Pedido #${o.numero}`,
          tipo: 'entrada' as const,
          valor: total,
          categoria: 'Vendas',
        };
      }),
      ...receivables.map((r) => ({
        id: r.id,
        data: r.pagoEm!,
        descricao: r.descricao,
        origem: `Conta a Receber #${r.numero}`,
        tipo: 'entrada' as const,
        valor: r.valorPago ?? r.valor,
        categoria: r.categoria ?? 'Outros',
      })),
      ...bills.map((b) => ({
        id: b.id,
        data: b.pagoEm!,
        descricao: b.descricao,
        origem: `Conta a Pagar #${b.numero}`,
        tipo: 'saida' as const,
        valor: b.valorPago ?? b.valor,
        categoria: b.categoria ?? 'Outros',
      })),
    ].sort((a, b) => a.data.localeCompare(b.data));

    // Saldo inicial = soma de tudo antes do mês selecionado
    const mesInicio = mes + '-01';
    const saldoInicial = all
      .filter((e) => e.data < mesInicio)
      .reduce((acc, e) => (e.tipo === 'entrada' ? acc + e.valor : acc - e.valor), 0);

    // Lançamentos do mês selecionado (sem filtros de busca — para KPIs)
    const doMes = all.filter((e) => e.data.startsWith(mes));

    const totalEntradas = doMes.filter((e) => e.tipo === 'entrada').reduce((a, e) => a + e.valor, 0);
    const totalSaidas   = doMes.filter((e) => e.tipo === 'saida').reduce((a, e) => a + e.valor, 0);

    // Aplica filtros de busca e tipo para a listagem
    let lancamentos = doMes;

    if (dto.tipo && dto.tipo !== 'all') {
      lancamentos = lancamentos.filter((e) => e.tipo === dto.tipo);
    }

    if (dto.search) {
      const q = dto.search.toLowerCase();
      lancamentos = lancamentos.filter(
        (e) =>
          e.descricao.toLowerCase().includes(q) ||
          e.origem.toLowerCase().includes(q) ||
          e.categoria.toLowerCase().includes(q),
      );
    }

    return {
      saldoInicial,
      totais: {
        entradas: totalEntradas,
        saidas: totalSaidas,
        saldo: totalEntradas - totalSaidas,
        saldoAtual: saldoInicial + totalEntradas - totalSaidas,
      },
      lancamentos,
    };
  }
}
