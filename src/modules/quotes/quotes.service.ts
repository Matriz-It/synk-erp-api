import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus, QuoteStatus } from '../../core/enums/enums';
import { Client } from '../clients/entities/client.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ListQuotesDto } from './dto/list-quotes.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteItem } from './entities/quote-item.entity';
import { Quote } from './entities/quote.entity';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepo: Repository<Quote>,
    @InjectRepository(QuoteItem)
    private readonly itemRepo: Repository<QuoteItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  async list(tenantId: string, query: ListQuotesDto) {
    const qb = this.quoteRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.client', 'client')
      .where('q.tenant_id = :tenantId', { tenantId })
      .orderBy('q.numero', 'DESC');

    if (query.status) qb.andWhere('q.status = :status', { status: query.status });

    if (query.search) {
      const s = query.search.toLowerCase();
      qb.andWhere(
        "(LOWER(client.razaoSocial) LIKE :s OR CAST(q.numero AS TEXT) LIKE :s)",
        { s: `%${s}%` },
      );
    }

    const quotes = await qb.getMany();
    await Promise.all(quotes.map(async (q) => { q.items = await this.itemRepo.findBy({ quoteId: q.id }) }));
    return quotes.map((q) => this.mapQuote(q));
  }

  async create(tenantId: string, dto: CreateQuoteDto) {
    const client = await this.clientRepo.findOneBy({ id: dto.clientId, tenantId });
    if (!client) throw new NotFoundException('Cliente não encontrado');

    type Snap = { nome: string; sku: string; preco: number };
    const snaps = new Map<string, Snap>();
    for (const item of dto.items) {
      const product = await this.productRepo.findOneBy({ id: item.productId, tenantId });
      if (!product) throw new NotFoundException(`Produto não encontrado: ${item.productId}`);
      snaps.set(item.productId, { nome: product.nome, sku: product.sku, preco: product.preco });
    }

    const result = await this.quoteRepo.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS next FROM quotes WHERE tenant_id = $1`,
      [tenantId],
    );
    const numero = parseInt(result[0].next as string, 10);

    const quote = await this.quoteRepo.save(
      this.quoteRepo.create({
        numero,
        clientId: dto.clientId,
        status: dto.status ?? QuoteStatus.RASCUNHO,
        obs: dto.obs?.trim() || null,
        descontoGlobal: dto.descontoGlobal ?? 0,
        formaPagamento: dto.formaPagamento?.trim() || null,
        dataPagamento: dto.dataPagamento || null,
        tenantId,
      }),
    );

    quote.items = await Promise.all(
      dto.items.map((item) => {
        const snap = snaps.get(item.productId)!;
        return this.itemRepo.save(
          this.itemRepo.create({
            quoteId: quote.id,
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

    quote.client = client;
    return this.mapQuote(quote);
  }

  async findOne(id: string, tenantId: string) {
    const quote = await this.quoteRepo.findOne({
      where: { id, tenantId },
      relations: ['client', 'items'],
    });
    if (!quote) throw new NotFoundException('Orçamento não encontrado');
    return {
      ...this.mapQuote(quote),
      items: quote.items.map((i) => this.mapItem(i)),
    };
  }

  async update(id: string, tenantId: string, dto: UpdateQuoteDto) {
    const quote = await this.quoteRepo.findOneBy({ id, tenantId });
    if (!quote) throw new NotFoundException('Orçamento não encontrado');

    if (dto.status !== undefined) quote.status = dto.status;
    if (dto.obs !== undefined) quote.obs = dto.obs.trim() || null;
    if (dto.descontoGlobal !== undefined) quote.descontoGlobal = dto.descontoGlobal;
    if (dto.formaPagamento !== undefined) quote.formaPagamento = dto.formaPagamento?.trim() || null;
    if (dto.dataPagamento !== undefined) quote.dataPagamento = dto.dataPagamento || null;

    const saved = await this.quoteRepo.save(quote);

    if (dto.items && dto.items.length > 0) {
      await this.itemRepo.delete({ quoteId: id });

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
              quoteId: saved.id,
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
      saved.items = await this.itemRepo.findBy({ quoteId: id });
    }

    saved.client = await this.clientRepo.findOneBy({ id: saved.clientId }) ?? undefined as any;
    return this.mapQuote(saved);
  }

  async convert(id: string, tenantId: string) {
    const quote = await this.quoteRepo.findOne({
      where: { id, tenantId },
      relations: ['client', 'items'],
    });
    if (!quote) throw new NotFoundException('Orçamento não encontrado');
    if (quote.status !== QuoteStatus.APROVADO) {
      throw new BadRequestException('Apenas orçamentos aprovados podem ser convertidos em pedido');
    }

    const result = await this.orderRepo.query(
      `SELECT COALESCE(MAX(numero), 999) + 1 AS next FROM orders WHERE tenant_id = $1`,
      [tenantId],
    );
    const numero = parseInt(result[0].next as string, 10);

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        numero,
        clientId: quote.clientId,
        status: OrderStatus.PENDENTE,
        obs: quote.obs,
        descontoGlobal: quote.descontoGlobal,
        formaPagamento: quote.formaPagamento,
        dataPagamento: quote.dataPagamento,
        tenantId,
      }),
    );

    order.items = await Promise.all(
      quote.items.map((qi) =>
        this.orderItemRepo.save(
          this.orderItemRepo.create({
            orderId: order.id,
            productId: qi.productId,
            nome: qi.nome,
            sku: qi.sku,
            preco: qi.preco,
            qtd: qi.qtd,
            desconto: qi.desconto,
          }),
        ),
      ),
    );

    order.client = quote.client;

    const items = order.items;
    const subtotal = items.reduce((acc, i) => acc + i.preco * i.qtd, 0);
    const descontosItem = items.reduce((acc, i) => acc + i.desconto, 0);
    const desconto = descontosItem + order.descontoGlobal;

    return {
      id: order.id,
      numero: order.numero,
      cliente: order.client?.razaoSocial ?? '',
      clienteId: order.clientId,
      status: order.status,
      itens: items.length,
      subtotal,
      desconto,
      total: Math.max(0, subtotal - desconto),
      criadoEm: order.createdAt.toISOString().split('T')[0],
      obs: order.obs ?? '',
      formaPagamento: order.formaPagamento ?? null,
      dataPagamento: order.dataPagamento ?? null,
    };
  }

  async remove(id: string, tenantId: string) {
    const quote = await this.quoteRepo.findOneBy({ id, tenantId });
    if (!quote) throw new NotFoundException('Orçamento não encontrado');
    if (quote.status !== QuoteStatus.RASCUNHO) {
      throw new BadRequestException('Apenas orçamentos com status "rascunho" podem ser excluídos');
    }
    await this.quoteRepo.remove(quote);
  }

  private mapQuote(q: Quote) {
    const items = q.items ?? [];
    const subtotal = items.reduce((acc, i) => acc + i.preco * i.qtd, 0);
    const descontosItem = items.reduce((acc, i) => acc + i.desconto, 0);
    const desconto = descontosItem + q.descontoGlobal;
    const total = Math.max(0, subtotal - desconto);

    return {
      id: q.id,
      numero: q.numero,
      cliente: q.client?.razaoSocial ?? '',
      clienteId: q.clientId,
      status: q.status,
      itens: items.length,
      subtotal,
      desconto,
      total,
      criadoEm: q.createdAt.toISOString().split('T')[0],
      obs: q.obs ?? '',
      formaPagamento: q.formaPagamento ?? null,
      dataPagamento: q.dataPagamento ?? null,
    };
  }

  private mapItem(i: QuoteItem) {
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
