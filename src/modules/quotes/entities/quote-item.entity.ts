import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Quote } from './quote.entity';

@Entity('quote_items')
export class QuoteItem extends BaseEntity {
  @Column({ name: 'quote_id' })
  quoteId: string;

  @ManyToOne(() => Quote, (q) => q.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quote_id' })
  quote: Quote;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ length: 150 })
  nome: string;

  @Column({ length: 50 })
  sku: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  preco: number;

  @Column()
  qtd: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  desconto: number;
}
