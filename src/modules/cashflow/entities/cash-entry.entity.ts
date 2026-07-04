import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MovementType } from '../../../core/enums/enums';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('cash_entries')
export class CashEntry extends BaseEntity {
  @Column({ length: 200 })
  descricao: string;

  @Column({ type: 'enum', enum: MovementType })
  tipo: MovementType;

  @Column({
    type: 'decimal', precision: 12, scale: 2,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  valor: number;

  @Column({ type: 'varchar', length: 10 })
  data: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
