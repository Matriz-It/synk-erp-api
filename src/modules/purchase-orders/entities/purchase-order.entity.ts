import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrderStatus } from '../../../core/enums/enums';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

@Entity('purchase_orders')
export class PurchaseOrder extends BaseEntity {
  @Column()
  numero: number;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ type: 'enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.RASCUNHO })
  status: PurchaseOrderStatus;

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

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => PurchaseOrderItem, (item) => item.order, { cascade: true })
  items: PurchaseOrderItem[];
}
