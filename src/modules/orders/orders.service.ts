import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceStatus, MovementType, OrderStatus } from '../../core/enums/enums';
import { Client } from '../clients/entities/client.entity';
import { ProductMovement } from '../products/entities/product-movement.entity';
import { Product } from '../products/entities/product.entity';
import { Receivable } from '../receivables/entities/receivable.entity';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)          private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)      private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Product)        private readonly productRepo: Repository<Product>,
    @InjectRepository(Client)         private readonly clientRepo: Repository<Client>,
    @InjectRepository(Receivable)     private readonly receivableRepo: Repository<Receivable>,
    @InjectRepository(ProductMovement) private readonly movementRepo: Repository<ProductMovement>,
    private readonly usersService: UsersService,
  ) {}

  async list(tenantId: string, query: ListOrdersDto) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.client', 'client')
      .where('o.tenant_id = :tenantId', { tenantId })
      .orderBy('o.numero', 'DESC');

    if (query.status) {
      qb.andWhere('o.status = :status', { status: query.status });
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      qb.andWhere(
        "(LOWER(client.razaoSocial) LIKE :q OR CAST(o.numero AS TEXT) LIKE :q)",
        { q: `%${q}%` },
      );
    }

    const orders = await qb.getMany();

    await Promise.all(
      orders.map(async (o) => {
        o.items = await this.itemRepo.findBy({ orderId: o.id });
      }),
    );

    return orders.map((o) => this.mapOrder(o));
  }

  async create(tenantId: string, dto: CreateOrderDto) {
    // clientId é opcional — venda rápida permite "Consumidor Final" sem vínculo
    const client = dto.clientId
      ? await this.clientRepo.findOneBy({ id: dto.clientId, tenantId })
      : null;
    if (dto.clientId && !client) throw new NotFoundException('Cliente não encontrado');

    type Snap = { nome: string; sku: string; preco: number };
    const snaps = new Map<string, Snap>();
    for (const item of dto.items) {
      const product = await this.productRepo.findOneBy({
        id: item.productId,
        tenantId,
      });
      if (!product)
        throw new NotFoundException(`Produto não encontrado: ${item.productId}`);
      snaps.set(item.productId, {
        nome: product.nome,
        sku: product.sku,
        preco: product.preco,
      });
    }

    const result = await this.orderRepo.query(
      `SELECT COALESCE(MAX(numero), 999) + 1 AS next FROM orders WHERE tenant_id = $1`,
      [tenantId],
    );
    const numero = parseInt(result[0].next as string, 10);
    const status = dto.status ?? OrderStatus.PENDENTE;

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        numero,
        clientId: dto.clientId ?? null,
        status,
        obs: dto.obs?.trim() || null,
        descontoGlobal: dto.descontoGlobal ?? 0,
        formaPagamento: dto.formaPagamento?.trim() || null,
        dataPagamento: dto.dataPagamento || null,
        tenantId,
      }),
    );

    order.items = await Promise.all(
      dto.items.map((item) => {
        const snap = snaps.get(item.productId)!;
        return this.itemRepo.save(
          this.itemRepo.create({
            orderId: order.id,
            productId: item.productId,
            nome: snap.nome,
            sku: snap.sku,
            preco: snap.preco,
            qtd: item.qtd,
            desconto: item.desconto ?? 0,
          }),
        );
      }),
    );

    order.client = client;

    // Gera conta a receber, saída de estoque e atualiza totais do cliente se já nasce concluído
    if (status === OrderStatus.CONCLUIDO) {
      await this.gerarContaReceber(order, client, tenantId, dto.pago);
      await this.gerarMovimentacaoSaida(order, tenantId, '');
      await this.atualizarTotaisCliente(order.clientId, tenantId);
    }

    return this.mapOrder(order);
  }

  async findOne(id: string, tenantId: string) {
    const order = await this.orderRepo.findOne({
      where: { id, tenantId },
      relations: ['client', 'items'],
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return {
      ...this.mapOrder(order),
      items: order.items.map((i) => this.mapItem(i)),
    };
  }

  async update(id: string, tenantId: string, dto: UpdateOrderDto, userId = '') {
    const order = await this.orderRepo.findOneBy({ id, tenantId });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    const wasNotConcluido = order.status !== OrderStatus.CONCLUIDO;

    if (dto.status !== undefined) {
      if (dto.status === OrderStatus.CONCLUIDO && wasNotConcluido) {
        order.concluidoEm = new Date().toISOString().split('T')[0];
      }
      order.status = dto.status;
    }
    if (dto.obs !== undefined) order.obs = dto.obs.trim() || null;
    if (dto.descontoGlobal !== undefined) order.descontoGlobal = dto.descontoGlobal;
    if (dto.formaPagamento !== undefined) order.formaPagamento = dto.formaPagamento?.trim() || null;
    if (dto.dataPagamento !== undefined) order.dataPagamento = dto.dataPagamento || null;

    const saved = await this.orderRepo.save(order);

    if (dto.items && dto.items.length > 0) {
      await this.itemRepo.delete({ orderId: id });

      type Snap = { nome: string; sku: string; preco: number };
      const snaps = new Map<string, Snap>();
      for (const item of dto.items) {
        const product = await this.productRepo.findOneBy({ id: item.productId, tenantId });
        if (!product) throw new NotFoundException(`Produto não encontrado: ${item.productId}`);
        snaps.set(item.productId, { nome: product.nome, sku: product.sku, preco: product.preco });
      }

      saved.items = await Promise.all(
        dto.items.map((item) => {
          const snap = snaps.get(item.productId)!;
          return this.itemRepo.save(
            this.itemRepo.create({
              orderId: saved.id,
              productId: item.productId,
              nome: snap.nome,
              sku: snap.sku,
              preco: snap.preco,
              qtd: item.qtd,
              desconto: item.desconto ?? 0,
            }),
          );
        }),
      );
    } else {
      saved.items = await this.itemRepo.findBy({ orderId: id });
    }

    saved.client = await this.clientRepo.findOneBy({ id: saved.clientId }) ?? undefined as any;

    // Gera conta a receber, saída de estoque e atualiza totais do cliente ao concluir
    if (dto.status === OrderStatus.CONCLUIDO && wasNotConcluido) {
      await this.gerarContaReceber(saved, saved.client, tenantId, dto.pago);
      await this.gerarMovimentacaoSaida(saved, tenantId, userId);
      await this.atualizarTotaisCliente(saved.clientId, tenantId);
    }

    return this.mapOrder(saved);
  }

  async remove(id: string, tenantId: string) {
    const order = await this.orderRepo.findOneBy({ id, tenantId });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (order.status !== OrderStatus.PENDENTE) {
      throw new BadRequestException(
        'Apenas pedidos com status "pendente" podem ser excluídos',
      );
    }
    await this.orderRepo.remove(order);
  }

  // ── Atualização de totais do cliente ────────────────────────────

  private async atualizarTotaisCliente(clientId: string | null, tenantId: string): Promise<void> {
    if (!clientId) return; // venda rápida sem cliente vinculado
    // Recalcula a partir de todos os pedidos CONCLUÍDOS do cliente (fonte de verdade)
    const result = await this.orderRepo.query(
      `SELECT
         COUNT(o.id)::int AS total_pedidos,
         COALESCE(SUM(
           (SELECT COALESCE(SUM(i.preco * i.qtd - i.desconto), 0)
            FROM order_items i WHERE i.order_id = o.id)
           - o.desconto_global
         ), 0)::numeric AS total_gasto
       FROM orders o
       WHERE o.client_id = $1
         AND o.tenant_id = $2
         AND o.status = 'concluido'`,
      [clientId, tenantId],
    );

    const { total_pedidos, total_gasto } = result[0];
    await this.clientRepo.update(
      { id: clientId, tenantId },
      {
        totalPedidos: parseInt(total_pedidos, 10),
        totalGasto:   parseFloat(total_gasto),
      },
    );
  }

  // ── Saída automática de estoque ao concluir pedido ──────────────

  private async gerarMovimentacaoSaida(
    order: Order,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const items = order.items?.length
      ? order.items
      : await this.itemRepo.findBy({ orderId: order.id });

    const operador = userId
      ? await this.usersService.findById(userId).then((u) => u?.name ?? u?.email ?? 'Sistema')
      : 'Sistema';

    for (const item of items) {
      const product = await this.productRepo.findOneBy({ id: item.productId, tenantId });
      if (!product) continue;

      const saldoApos = Math.max(0, product.qtd - item.qtd);

      await this.movementRepo.save(
        this.movementRepo.create({
          tipo:      MovementType.SAIDA,
          qtd:       item.qtd,
          motivo:    `Pedido de Venda #${order.numero} — concluído`,
          saldoApos,
          operador,
          productId: product.id,
          userId:    userId || 'sistema',
        }),
      );

      product.qtd = saldoApos;
      await this.productRepo.save(product);
    }
  }

  // ── Geração automática de Conta a Receber ───────────────────────

  private async gerarContaReceber(
    order: Order,
    client: Client,
    tenantId: string,
    pago = false,
  ): Promise<void> {
    const descricao = `Pedido de Venda #${order.numero}`;

    // Não duplica se já existe uma conta para este pedido
    const existente = await this.receivableRepo.findOne({ where: { tenantId, descricao } });
    if (existente) return;

    const items = order.items?.length
      ? order.items
      : await this.itemRepo.findBy({ orderId: order.id });

    const subtotal      = items.reduce((acc, i) => acc + i.preco * i.qtd, 0);
    const descontosItem = items.reduce((acc, i) => acc + i.desconto, 0);
    const total         = Math.max(0, subtotal - descontosItem - (order.descontoGlobal ?? 0));

    if (total <= 0) return;

    const hoje      = new Date().toISOString().split('T')[0];
    const vencimento = order.dataPagamento
      ?? (pago ? hoje : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const numResult = await this.receivableRepo.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS next FROM receivables WHERE tenant_id = $1`,
      [tenantId],
    );
    const numero = parseInt(numResult[0].next, 10);

    await this.receivableRepo.save(
      this.receivableRepo.create({
        numero,
        parceiro:   client?.razaoSocial ?? 'Consumidor Final',
        descricao,
        valor:      total,
        vencimento,
        status:     pago ? FinanceStatus.PAGO : FinanceStatus.ABERTO,
        categoria:  'clientes',
        obs:        order.obs,
        tenantId,
        // Se pago, registra data e valor recebido imediatamente
        ...(pago && {
          pagoEm:    order.dataPagamento ?? hoje,
          valorPago: total,
        }),
      }),
    );
  }

  // ── Mappers ──────────────────────────────────────────────────────

  private mapOrder(order: Order) {
    const items = order.items ?? [];
    const subtotal = items.reduce((acc, i) => acc + i.preco * i.qtd, 0);
    const descontosItem = items.reduce((acc, i) => acc + i.desconto, 0);
    const desconto = descontosItem + order.descontoGlobal;
    const total = Math.max(0, subtotal - desconto);

    return {
      id: order.id,
      numero: order.numero,
      cliente: order.client?.razaoSocial ?? '',
      clienteId: order.clientId,
      status: order.status,
      itens: items.length,
      subtotal,
      desconto,
      total,
      criadoEm: order.createdAt.toISOString().split('T')[0],
      obs: order.obs ?? '',
      formaPagamento: order.formaPagamento ?? null,
      dataPagamento: order.dataPagamento ?? null,
    };
  }

  private mapItem(i: OrderItem) {
    return {
      id: i.id,
      productId: i.productId,
      nome: i.nome,
      sku: i.sku,
      preco: i.preco,
      qtd: i.qtd,
      desconto: i.desconto,
      total: i.preco * i.qtd - i.desconto,
    };
  }
}
