import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { FaturaStatus } from '../../../core/enums/enums';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('faturas')
export class Fatura extends BaseEntity {
  @Column()
  numero: number;

  @Column({ type: 'varchar', length: 10, name: 'ciclo_inicio' })
  cicloInicio: string;

  @Column({ type: 'varchar', length: 10, name: 'ciclo_fim' })
  cicloFim: string;

  @Column({ type: 'varchar', length: 10 })
  vencimento: string;

  @Column({
    type: 'decimal', precision: 12, scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  valor: number;

  @Column({ type: 'enum', enum: FaturaStatus, default: FaturaStatus.PENDENTE })
  status: FaturaStatus;

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

  /** Id do Payment do Mercado Pago que pagou (ou está tentando pagar) esta fatura — chave de idempotência do webhook. */
  @Column({ type: 'varchar', length: 64, unique: true, name: 'mp_payment_id', nullable: true })
  mpPaymentId: string | null;
}
