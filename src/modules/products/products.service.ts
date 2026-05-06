import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovementType } from '../../core/enums/enums';
import { UsersService } from '../users/users.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductMovement } from './entities/product-movement.entity';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    @InjectRepository(ProductMovement)
    private readonly movRepo: Repository<ProductMovement>,
    private readonly usersService: UsersService,
  ) {}

  async list(tenantId: string, query: ListProductsDto) {
    const qb = this.repo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId });

    if (query.search) {
      qb.andWhere(
        '(LOWER(p.nome) LIKE :search OR LOWER(p.sku) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query.categoria) {
      qb.andWhere('p.categoria = :categoria', { categoria: query.categoria });
    }

    switch (query.status) {
      case 'ativo':   qb.andWhere('p.ativo = true'); break;
      case 'inativo': qb.andWhere('p.ativo = false'); break;
      case 'baixo':   qb.andWhere('p.qtd < p.qtd_min AND p.qtd > 0'); break;
      case 'zerado':  qb.andWhere('p.qtd = 0'); break;
    }

    const col =
      query.sortBy === 'preco' ? 'p.preco' :
      query.sortBy === 'qtd'   ? 'p.qtd'   : 'p.nome';
    qb.orderBy(col, query.sortDir === 'desc' ? 'DESC' : 'ASC');

    const products = await qb.getMany();
    return products.map((p) => this.mapProduct(p));
  }

  async create(tenantId: string, userId: string, dto: CreateProductDto) {
    const sku = dto.sku.toUpperCase().trim();
    const exists = await this.repo.findOneBy({ sku, tenantId });
    if (exists) throw new ConflictException('SKU já cadastrado');

    const product = await this.repo.save(
      this.repo.create({
        sku,
        nome: dto.nome.trim(),
        categoria: dto.categoria,
        preco: dto.preco,
        qtd: dto.qtdInicial ?? 0,
        qtdMin: dto.qtdMin ?? 10,
        foto: dto.foto ?? null,
        ativo: dto.ativo ?? true,
        tenantId,
      }),
    );

    if (dto.qtdInicial && dto.qtdInicial > 0) {
      const operador = await this.resolveOperador(userId);
      await this.movRepo.save(
        this.movRepo.create({
          tipo: MovementType.ENTRADA,
          qtd: dto.qtdInicial,
          motivo: 'Estoque inicial',
          saldoApos: dto.qtdInicial,
          productId: product.id,
          userId,
          operador,
        }),
      );
    }

    return this.mapProduct(product);
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.repo.findOneBy({ id, tenantId });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const movimentacoes = await this.movRepo.find({
      where: { productId: id },
      order: { createdAt: 'DESC' },
    });

    return {
      ...this.mapProduct(product),
      movimentacoes: movimentacoes.map((m) => this.mapMovement(m)),
    };
  }

  async update(id: string, tenantId: string, dto: UpdateProductDto) {
    const product = await this.repo.findOneBy({ id, tenantId });
    if (!product) throw new NotFoundException('Produto não encontrado');

    if (dto.sku) {
      const sku = dto.sku.toUpperCase().trim();
      if (sku !== product.sku) {
        const exists = await this.repo.findOneBy({ sku, tenantId });
        if (exists) throw new ConflictException('SKU já cadastrado');
      }
      dto.sku = sku;
    }

    Object.assign(product, dto);
    const saved = await this.repo.save(product);
    return this.mapProduct(saved);
  }

  async createMovement(
    productId: string,
    tenantId: string,
    userId: string,
    dto: CreateMovementDto,
  ) {
    const product = await this.repo.findOneBy({ id: productId, tenantId });
    if (!product) throw new NotFoundException('Produto não encontrado');

    if (dto.tipo === MovementType.SAIDA && dto.qtd > product.qtd) {
      throw new BadRequestException(
        `Quantidade superior ao estoque disponível (${product.qtd} un.)`,
      );
    }

    const saldoApos =
      dto.tipo === MovementType.ENTRADA
        ? product.qtd + dto.qtd
        : product.qtd - dto.qtd;

    const operador = await this.resolveOperador(userId);

    const mov = await this.movRepo.save(
      this.movRepo.create({
        tipo: dto.tipo,
        qtd: dto.qtd,
        motivo: dto.motivo.trim(),
        saldoApos,
        productId,
        userId,
        operador,
      }),
    );

    product.qtd = saldoApos;
    await this.repo.save(product);

    return this.mapMovement(mov);
  }

  async listMovements(productId: string, tenantId: string) {
    const product = await this.repo.findOneBy({ id: productId, tenantId });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const movs = await this.movRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
    return movs.map((m) => this.mapMovement(m));
  }

  private async resolveOperador(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    return user?.name ?? user?.email ?? 'Sistema';
  }

  private mapProduct(p: Product) {
    return {
      id: p.id,
      sku: p.sku,
      nome: p.nome,
      categoria: p.categoria,
      preco: p.preco,
      qtd: p.qtd,
      qtdMin: p.qtdMin,
      foto: p.foto,
      ativo: p.ativo,
      criadoEm: p.createdAt.toISOString().split('T')[0],
    };
  }

  private mapMovement(m: ProductMovement) {
    return {
      id: m.id,
      tipo: m.tipo,
      qtd: m.qtd,
      motivo: m.motivo,
      data: m.createdAt.toISOString().split('T')[0],
      operador: m.operador,
      saldoApos: m.saldoApos,
    };
  }
}
