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
import { ListAllMovementsDto } from './dto/list-all-movements.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { SaveComponentsDto } from './dto/save-components.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductComponent } from './entities/product-component.entity';
import { ProductMovement } from './entities/product-movement.entity';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    @InjectRepository(ProductMovement)
    private readonly movRepo: Repository<ProductMovement>,
    @InjectRepository(ProductComponent)
    private readonly compRepo: Repository<ProductComponent>,
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
        precoCusto: dto.precoCusto ?? null,
        qtd: dto.qtdInicial ?? 0,
        qtdMin: dto.qtdMin ?? 10,
        foto: dto.foto ?? null,
        ativo: dto.ativo ?? true,
        isMateriaPrima: dto.isMateriaPrima ?? false,
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

    const [movimentacoes, componentes] = await Promise.all([
      this.movRepo.find({ where: { productId: id }, order: { createdAt: 'DESC' } }),
      this.compRepo.find({ where: { productId: id }, relations: ['material'], order: { createdAt: 'ASC' } }),
    ]);

    return {
      ...this.mapProduct(product),
      movimentacoes: movimentacoes.map((m) => this.mapMovement(m)),
      componentes: componentes.map((c) => ({
        id: c.id,
        materialId: c.materialId,
        materialNome: c.material?.nome ?? '',
        materialSku: c.material?.sku ?? '',
        quantidade: c.quantidade,
        unidade: c.unidade,
      })),
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

    // Se for ENTRADA e o produto tem composição, desconta as matérias-primas
    if (dto.tipo === MovementType.ENTRADA) {
      await this.descontarMateriasPrimas(productId, dto.qtd, userId, operador, tenantId);
    }

    return this.mapMovement(mov);
  }

  private async descontarMateriasPrimas(
    productId: string,
    qtdProduzida: number,
    userId: string,
    operador: string,
    tenantId: string,
  ): Promise<void> {
    const componentes = await this.compRepo.find({
      where: { productId },
      relations: ['material'],
    });
    if (!componentes.length) return;

    for (const comp of componentes) {
      const mat = await this.repo.findOneBy({ id: comp.materialId, tenantId });
      if (!mat) continue;

      const qtdConsumir = comp.quantidade * qtdProduzida;
      const saldoApos   = Math.max(0, mat.qtd - qtdConsumir);
      const motivo      = `Consumo para produção de ${qtdProduzida} un. — ${mat.nome}`;

      await this.movRepo.save(
        this.movRepo.create({
          tipo:      MovementType.SAIDA,
          qtd:       qtdConsumir,
          motivo,
          saldoApos,
          productId: comp.materialId,
          userId,
          operador,
        }),
      );

      mat.qtd = saldoApos;
      await this.repo.save(mat);
    }
  }

  async listAllMovements(tenantId: string, query: ListAllMovementsDto) {
    const qb = this.movRepo
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.product', 'p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .orderBy('m.createdAt', 'DESC');

    if (query.tipo) qb.andWhere('m.tipo = :tipo', { tipo: query.tipo });
    if (query.productId) qb.andWhere('m.product_id = :productId', { productId: query.productId });

    const movs = await qb.getMany();
    return movs.map((m) => ({
      ...this.mapMovement(m),
      produto: m.product?.nome ?? '',
      sku: m.product?.sku ?? '',
      productId: m.productId,
    }));
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
      precoCusto: p.precoCusto ?? null,
      qtd: p.qtd,
      qtdMin: p.qtdMin,
      foto: p.foto,
      ativo: p.ativo,
      isMateriaPrima: p.isMateriaPrima,
      criadoEm: p.createdAt.toISOString().split('T')[0],
    };
  }

  // ── Composição / Ficha Técnica ────────────────────────────────────

  async listComponents(productId: string, tenantId: string) {
    const product = await this.repo.findOneBy({ id: productId, tenantId });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const comps = await this.compRepo.find({
      where: { productId },
      relations: ['material'],
      order: { createdAt: 'ASC' },
    });

    return comps.map((c) => ({
      id: c.id,
      materialId: c.materialId,
      materialNome: c.material?.nome ?? '',
      materialSku: c.material?.sku ?? '',
      quantidade: c.quantidade,
      unidade: c.unidade,
    }));
  }

  async saveComponents(productId: string, tenantId: string, dto: SaveComponentsDto) {
    const product = await this.repo.findOneBy({ id: productId, tenantId });
    if (!product) throw new NotFoundException('Produto não encontrado');
    if (product.isMateriaPrima) {
      throw new BadRequestException('Matérias-primas não podem ter composição');
    }

    // Valida se todos os materiais pertencem ao tenant e são matérias-primas
    for (const comp of dto.componentes) {
      const mat = await this.repo.findOneBy({ id: comp.materialId, tenantId });
      if (!mat) throw new NotFoundException(`Material não encontrado: ${comp.materialId}`);
      if (!mat.isMateriaPrima) {
        throw new BadRequestException(
          `"${mat.nome}" não está marcado como matéria-prima. Edite o produto e selecione o tipo "Matéria-Prima".`,
        );
      }
    }

    // Substitui todos os componentes
    await this.compRepo.delete({ productId });
    if (dto.componentes.length > 0) {
      await this.compRepo.save(
        dto.componentes.map((c) =>
          this.compRepo.create({
            productId,
            materialId: c.materialId,
            quantidade: c.quantidade,
            unidade: c.unidade,
          }),
        ),
      );
    }
    return this.listComponents(productId, tenantId);
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
