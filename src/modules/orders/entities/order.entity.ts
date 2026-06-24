import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { OrderStatus } from '../../../core/enums/enums';
import { Client } from '../../clients/entities/client.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order extends BaseEntity {
  @Column()
  numero: number;

  @Column({ name: 'client_id', nullable: true, type: 'uuid' })
  clientId: string | null;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDENTE })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  obs: string | null;

  @Column({
    name: 'desconto_global',
    type: 'decimal', precision: 12, scale: 2, default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  descontoGlobal: number;

  @Column({ type: 'varchar', name: 'forma_pagamento', length: 50, nullable: true })
  formaPagamento: string | null;

  @Column({ type: 'varchar', name: 'data_pagamento', length: 10, nullable: true })
  dataPagamento: string | null;

  @Column({ type: 'varchar', name: 'concluido_em', length: 10, nullable: true })
  concluidoEm: string | null;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
