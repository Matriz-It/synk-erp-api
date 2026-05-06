import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MovementType } from '../../../core/enums/enums';
import { Product } from './product.entity';

@Entity('product_movements')
export class ProductMovement extends BaseEntity {
  @Column({ type: 'enum', enum: MovementType })
  tipo: MovementType;

  @Column()
  qtd: number;

  @Column({ length: 200 })
  motivo: string;

  @Column({ name: 'saldo_apos' })
  saldoApos: number;

  @Column({ length: 100 })
  operador: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, (p) => p.movimentacoes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'user_id' })
  userId: string;
}
