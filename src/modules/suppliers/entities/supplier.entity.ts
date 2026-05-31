import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ClienteTipo } from '../../../core/enums/enums';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('suppliers')
@Unique(['documento', 'tenantId'])
export class Supplier extends BaseEntity {
  @Column({ type: 'enum', enum: ClienteTipo })
  tipo: ClienteTipo;

  @Column({ length: 150 })
  razaoSocial: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  nomeFantasia: string | null;

  @Column({ type: 'varchar', length: 14 })
  documento: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone: string | null;

  @Column({ default: true })
  ativo: boolean;

  @Column({ type: 'varchar', length: 9 })
  cep: string;

  @Column({ length: 150 })
  logradouro: string;

  @Column({ length: 20 })
  numero: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  complemento: string | null;

  @Column({ length: 100 })
  bairro: string;

  @Column({ length: 100 })
  cidade: string;

  @Column({ length: 2 })
  uf: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
