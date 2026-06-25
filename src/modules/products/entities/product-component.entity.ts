import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';

@Entity('product_components')
export class ProductComponent extends BaseEntity {
  /** Produto acabado (que usa a matéria prima) */
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  /** Matéria prima usada */
  @Column({ name: 'material_id', type: 'uuid' })
  materialId: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'material_id' })
  material: Product;

  /** Quantidade de matéria prima por unidade do produto acabado */
  @Column({
    type: 'decimal', precision: 10, scale: 3,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  quantidade: number;

  /** Unidade de medida (g, kg, ml, L, un, m, pç…) */
  @Column({ type: 'varchar', length: 10 })
  unidade: string;
}
