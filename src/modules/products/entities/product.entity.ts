import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductCategory } from '../../../core/enums/enums';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { ProductMovement } from './product-movement.entity';

@Entity('products')
@Unique(['sku', 'tenantId'])
export class Product extends BaseEntity {
  @Column({ length: 50 })
  sku: string;

  @Column({ length: 150 })
  nome: string;

  @Column({ type: 'enum', enum: ProductCategory })
  categoria: ProductCategory;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  preco: number;

  @Column({ default: 0 })
  qtd: number;

  @Column({ name: 'qtd_min', default: 10 })
  qtdMin: number;

  @Column({ type: 'text', nullable: true })
  foto: string | null;

  @Column({ default: true })
  ativo: boolean;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => ProductMovement, (m) => m.product)
  movimentacoes: ProductMovement[];
}
