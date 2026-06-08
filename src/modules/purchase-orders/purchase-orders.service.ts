import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceStatus, PurchaseOrderStatus } from '../../core/enums/enums';
import { Bill } from '../bills/entities/bill.entity';
import { Product } from '../products/entities/product.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ListPurchaseOrdersDto } from './dto/list-purchase-orders.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)     private readonly repo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem) private readonly itemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(Supplier)          private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(Product)           private readonly productRepo: Repository<Product>,
    @InjectRepository(Bill)              private readonly billRepo: Repository<Bill>,
  ) {}

  async list(tenantId: string, query: ListPurchaseOrdersDto) {
    const qb = this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.supplier', 'supplier')
      .where('o.tenant_id = :tenantId', { tenantId })
      .orderBy('o.numero', 'DESC');

    if (query.status) qb.andWhere('o.status = :status', { status: query.status });
    if (query.search) {
      const q = query.search.toLowerCase();
      qb.andWhere(
        '(LOWER(supplier.razaoSocial) LIKE :q OR CAST(o.numero AS TEXT) LIKE :q)',
        { q: `%${q}%` },
      );
    }

    const orders = await qb.getMany();
    await Promise.all(orders.map(async (o) => { o.items = await this.itemRepo.findBy({ orderId: o.id }) }));
    return orders.map((o) => this.mapOrder(o));
  }

  async create(tenantId: string, dto: CreatePurchaseOrderDto) {
    const supplier = await this.supplierRepo.findOneBy({ id: dto.clientId, tenantId });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');

    type Snap = { nome: string; sku: string; preco: number };
    const snaps = new Map<string, Snap>();
    for (const item of dto.items) {
      const product = await this.productRepo.findOneBy({ id: item.productId, tenantId });
      if (!product) throw new NotFoundException(`Produto não encontrado: ${item.productId}`);
      snaps.set(item.productId, { nome: product.nome, sku: product.sku, preco: product.preco });
    }

    const result = await this.repo.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS next FROM purchase_orders WHERE tenant_id = $1`,
      [tenantId],
    );
    const numero = parseInt(result[0].next, 10);
    const status = dto.status ?? PurchaseOrderStatus.RASCUNHO;

    const order = await this.repo.save(
      this.repo.create({
        numero, supplierId: dto.clientId, status,
        obs: dto.obs?.trim() || null,
        descontoGlobal: dto.descontoGlobal ?? 0,
        formaPagamento: dto.formaPagamento?.trim() || null,
        dataPagamento: dto.dataPagamento || null,
        tenantId,
      }),
    );

    order.items = await Promise.all(dto.items.map((item) => {
      const snap = snaps.get(item.productId)!;
      return this.itemRepo.save(this.itemRepo.create({
        orderId: order.id, productId: item.productId,
        nome: snap.nome, sku: snap.sku, preco: snap.preco,
        qtd: item.qtd, desconto: item.desconto ?? 0,
      }));
    }));
    order.supplier = supplier;

    // Cria Conta a Pagar automaticamente ao aprovar
    if (status === PurchaseOrderStatus.APROVADO) {
      await this.gerarContaPagar(order, tenantId);
    }

    return this.mapOrder(order);
  }

  async findOne(id: string, tenantId: string) {
    const order = await this.repo.findOne({ where: { id, tenantId }, relations: ['supplier', 'items'] });
    if (!order) throw new NotFoundException('Pedido de compra não encontrado');
    return { ...this.mapOrder(order), items: order.items.map((i) => this.mapItem(i)) };
  }

  async update(id: string, tenantId: string, dto: UpdatePurchaseOrderDto) {
    const order = await this.repo.findOneBy({ id, tenantId });
    if (!order) throw new NotFoundException('Pedido de compra não encontrado');

    const wasAprovado = order.status === PurchaseOrderStatus.APROVADO;

    if (dto.clientId !== undefined) order.supplierId = dto.clientId;
    if (dto.status !== undefined) order.status = dto.status;
    if (dto.obs !== undefined) order.obs = dto.obs.trim() || null;
    if (dto.descontoGlobal !== undefined) order.descontoGlobal = dto.descontoGlobal;
    if (dto.formaPagamento !== undefined) order.formaPagamento = dto.formaPagamento?.trim() || null;
    if (dto.dataPagamento !== undefined) order.dataPagamento = dto.dataPagamento || null;

    const saved = await this.repo.save(order);

    if (dto.items && dto.items.length > 0) {
      await this.itemRepo.delete({ orderId: id });
      type Snap = { nome: string; sku: string; preco: number };
      const snaps = new Map<string, Snap>();
      for (const item of dto.items) {
        const product = await this.productRepo.findOneBy({ id: item.productId, tenantId });
        if (!product) throw new NotFoundException(`Produto não encontrado: ${item.productId}`);
        snaps.set(item.productId, { nome: product.nome, sku: product.sku, preco: product.preco });
      }
      saved.items = await Promise.all(dto.items.map((item) => {
        const snap = snaps.get(item.productId)!;
        return this.itemRepo.save(this.itemRepo.create({
          orderId: saved.id, productId: item.productId,
          nome: snap.nome, sku: snap.sku, preco: snap.preco,
          qtd: item.qtd, desconto: item.desconto ?? 0,
        }));
      }));
    } else {
      saved.items = await this.itemRepo.findBy({ orderId: id });
    }

    saved.supplier = await this.supplierRepo.findOneBy({ id: saved.supplierId }) ?? undefined as any;

    // Cria Conta a Pagar ao aprovar pela primeira vez
    if (!wasAprovado && saved.status === PurchaseOrderStatus.APROVADO) {
      await this.gerarContaPagar(saved, tenantId);
    }

    return this.mapOrder(saved);
  }

  async remove(id: string, tenantId: string) {
    const order = await this.repo.findOneBy({ id, tenantId });
    if (!order) throw new NotFoundException('Pedido de compra não encontrado');
    if (order.status !== PurchaseOrderStatus.RASCUNHO) {
      throw new BadRequestException('Apenas rascunhos podem ser excluídos');
    }
    await this.repo.remove(order);
  }

  // ── Geração automática de Conta a Pagar ─────────────────────────

  private async gerarContaPagar(order: PurchaseOrder, tenantId: string): Promise<void> {
    const descricao = `Pedido de Compra #${order.numero}`;

    // Não duplica se já existe uma conta para este pedido
    const existente = await this.billRepo.findOne({ where: { tenantId, descricao } });
    if (existente) return;

    const items = order.items?.length
      ? order.items
      : await this.itemRepo.findBy({ orderId: order.id });

    const subtotal      = items.reduce((acc, i) => acc + i.preco * i.qtd, 0);
    const descontosItem = items.reduce((acc, i) => acc + i.desconto, 0);
    const total         = Math.max(0, subtotal - descontosItem - order.descontoGlobal);

    // Vencimento: usa dataPagamento do pedido; se não definido, 30 dias a partir de hoje
    const vencimento = order.dataPagamento
      ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const numResult = await this.billRepo.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS next FROM bills WHERE tenant_id = $1`,
      [tenantId],
    );
    const numero = parseInt(numResult[0].next, 10);

    await this.billRepo.save(
      this.billRepo.create({
        numero,
        parceiro:    order.supplier?.razaoSocial ?? '',
        descricao,
        valor:       total,
        vencimento,
        status:      FinanceStatus.ABERTO,
        categoria:   'fornecedores',
        obs:         order.obs,
        tenantId,
      }),
    );
  }

  // ── Mappers ──────────────────────────────────────────────────────

  private mapOrder(o: PurchaseOrder) {
    const items = o.items ?? [];
    const subtotal      = items.reduce((acc, i) => acc + i.preco * i.qtd, 0);
    const descontosItem = items.reduce((acc, i) => acc + i.desconto, 0);
    const desconto      = descontosItem + o.descontoGlobal;
    return {
      id: o.id, numero: o.numero,
      cliente: o.supplier?.razaoSocial ?? '',
      clienteId: o.supplierId,
      status: o.status, itens: items.length,
      subtotal, desconto, total: Math.max(0, subtotal - desconto),
      criadoEm: o.createdAt.toISOString().split('T')[0],
      obs: o.obs ?? '',
      formaPagamento: o.formaPagamento ?? null,
      dataPagamento:  o.dataPagamento  ?? null,
      descontoGlobal: o.descontoGlobal,
    };
  }

  private mapItem(i: PurchaseOrderItem) {
    return {
      id: i.id, productId: i.productId,
      nome: i.nome, sku: i.sku, preco: i.preco,
      qtd: i.qtd, desconto: i.desconto,
      total: i.preco * i.qtd - i.desconto,
    };
  }
}
