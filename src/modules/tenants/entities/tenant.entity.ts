import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TenantPlan, TenantStatus } from '../../../core/enums/enums';
import { User } from '../../users/entities/user.entity';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', unique: true, length: 18, nullable: true })
  document: string | null;

  @Column({ type: 'enum', enum: TenantPlan, default: TenantPlan.FREE })
  plan: TenantPlan;

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
  status: TenantStatus;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}
