import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('services')
@Unique(['codigo', 'tenantId'])
export class Service extends BaseEntity {
  @Column({ length: 50 })
  codigo: string;

  @Column({ length: 150 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  preco: number;

  @Column({
    name: 'preco_custo',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: null,
    transformer: { to: (v: number | null) => v, from: (v: string | null) => v !== null ? parseFloat(v) : null },
  })
  precoCusto: number | null;

  @Column({ default: true })
  ativo: boolean;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
