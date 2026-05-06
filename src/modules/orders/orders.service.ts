import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus } from '../../core/enums/enums';
import { Client } from '../clients/entities/client.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
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
    const client = await this.clientRepo.findOneBy({
      id: dto.clientId,
      tenantId,
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');

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

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        numero,
        clientId: dto.clientId,
        status: dto.status ?? OrderStatus.PENDENTE,
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

  async update(id: string, tenantId: string, dto: UpdateOrderDto) {
    const order = await this.orderRepo.findOneBy({ id, tenantId });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    if (dto.status !== undefined) order.status = dto.status;
    if (dto.obs !== undefined) order.obs = dto.obs.trim() || null;
    if (dto.descontoGlobal !== undefined) order.descontoGlobal = dto.descontoGlobal;
    if (dto.formaPagamento !== undefined) order.formaPagamento = dto.formaPagamento?.trim() || null;
    if (dto.dataPagamento !== undefined) order.dataPagamento = dto.dataPagamento || null;

    const saved = await this.orderRepo.save(order);

    if (dto.items && dto.items.length > 0) {
      // Substitui todos os itens
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
