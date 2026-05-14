import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Nfe } from './nfe.entity';

const dec = (precision = 12, scale = 2) => ({
  type: 'decimal' as const,
  precision,
  scale,
  transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
});

@Entity('nfe_items')
export class NfeItem extends BaseEntity {
  @Column({ name: 'nfe_id' })
  nfeId: string;

  @ManyToOne(() => Nfe, (nfe) => nfe.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nfe_id' })
  nfe: Nfe;

  @Column({ type: 'varchar', name: 'produto_id', nullable: true })
  produtoId: string | null;

  @Column({ type: 'varchar', length: 60 })
  sku: string;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ ...dec(10, 3) })
  qtd: number;

  @Column({ ...dec() })
  preco: number;

  @Column({ ...dec(), default: 0 })
  desconto: number;

  @Column({ type: 'varchar', length: 5 })
  cfop: string;

  @Column({ type: 'varchar', length: 3 })
  cst: string;

  @Column({ name: 'bc_icms', ...dec(), default: 0 })
  bcICMS: number;

  @Column({ name: 'aliq_icms', ...dec(5, 2), default: 0 })
  aliqICMS: number;

  @Column({ name: 'valor_icms', ...dec(), default: 0 })
  valorICMS: number;
}
