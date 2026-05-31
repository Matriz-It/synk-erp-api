import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { FinanceStatus } from '../../../core/enums/enums';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('bills')
export class Bill extends BaseEntity {
  @Column()
  numero: number;

  @Column({ length: 150 })
  parceiro: string;

  @Column({ length: 200 })
  descricao: string;

  @Column({
    type: 'decimal', precision: 12, scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  valor: number;

  @Column({ type: 'varchar', length: 10 })
  vencimento: string;

  @Column({ type: 'enum', enum: FinanceStatus, default: FinanceStatus.ABERTO })
  status: FinanceStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  categoria: string | null;

  @Column({ type: 'text', nullable: true })
  obs: string | null;

  @Column({ type: 'varchar', length: 10, name: 'pago_em', nullable: true })
  pagoEm: string | null;

  @Column({
    type: 'decimal', precision: 12, scale: 2,
    name: 'valor_pago', nullable: true, default: null,
    transformer: { to: (v: number | null) => v, from: (v: string | null) => v !== null ? parseFloat(v) : null },
  })
  valorPago: number | null;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
