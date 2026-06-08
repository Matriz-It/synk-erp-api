import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem extends BaseEntity {
  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => PurchaseOrder, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: PurchaseOrder;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ length: 150 }) nome: string;
  @Column({ length: 50  }) sku:  string;

  @Column({
    type: 'decimal', precision: 10, scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  preco: number;

  @Column() qtd: number;

  @Column({
    type: 'decimal', precision: 10, scale: 2, default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  desconto: number;
}
