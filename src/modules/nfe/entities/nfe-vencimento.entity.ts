import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Nfe } from './nfe.entity';

@Entity('nfe_vencimentos')
export class NfeVencimento extends BaseEntity {
  @Column({ name: 'nfe_id' })
  nfeId: string;

  @ManyToOne(() => Nfe, (nfe) => nfe.vencimentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nfe_id' })
  nfe: Nfe;

  @Column({ type: 'varchar', length: 10 })
  data: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  valor: number;

  @Column({ type: 'text', nullable: true })
  obs: string | null;
}
