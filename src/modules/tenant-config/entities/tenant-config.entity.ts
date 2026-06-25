import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

const vc = (length: number) => ({ type: 'varchar' as const, nullable: true as const, length });

@Entity('tenant_configs')
export class TenantConfig extends BaseEntity {
  @Column({ type: 'uuid', name: 'tenant_id', unique: true })
  tenantId: string;

  @OneToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ── Dados complementares da empresa ──────────────────────────────
  @Column({ ...vc(150), name: 'nome_fantasia' })  nomeFantasia: string | null;
  @Column({ ...vc(20) })                           ie: string | null;
  @Column({ ...vc(20) })                           im: string | null;
  @Column({ ...vc(10) })                           cnae: string | null;
  @Column({ ...vc(20) })                           telefone: string | null;
  @Column({ ...vc(100), name: 'email_comercial' }) emailComercial: string | null;

  // ── Endereço ──────────────────────────────────────────────────────
  @Column({ ...vc(9) })   cep: string | null;
  @Column({ ...vc(150) }) logradouro: string | null;
  @Column({ ...vc(20) })  numero: string | null;
  @Column({ ...vc(100) }) complemento: string | null;
  @Column({ ...vc(100) }) bairro: string | null;
  @Column({ ...vc(100) }) cidade: string | null;
  @Column({ ...vc(2) })   uf: string | null;

  // ── Configurações Fiscais / NFe ───────────────────────────────────
  @Column({ ...vc(1) })                             crt: string | null;
  @Column({ ...vc(3),  name: 'serie_nfe',    default: '1'           }) serieNfe: string | null;
  @Column({ ...vc(20), name: 'ambiente_nfe', default: 'homologacao' }) ambienteNfe: string | null;
  @Column({ ...vc(5),  name: 'cfop_padrao'  }) cfopPadrao: string | null;
  @Column({ ...vc(3),  name: 'cst_padrao'   }) cstPadrao: string | null;
  @Column({ ...vc(100), name: 'email_nfe'   }) emailNfe: string | null;

  @Column({
    name: 'aliq_icms', type: 'decimal', precision: 5, scale: 2, nullable: true,
    transformer: { to: (v: number | null) => v, from: (v: string | null) => v !== null ? parseFloat(v) : null },
  }) aliqIcms: number | null;

  @Column({
    name: 'aliq_ibs', type: 'decimal', precision: 5, scale: 2, nullable: true,
    transformer: { to: (v: number | null) => v, from: (v: string | null) => v !== null ? parseFloat(v) : null },
  }) aliqIbs: number | null;

  @Column({
    name: 'aliq_cbs', type: 'decimal', precision: 5, scale: 2, nullable: true,
    transformer: { to: (v: number | null) => v, from: (v: string | null) => v !== null ? parseFloat(v) : null },
  }) aliqCbs: number | null;

  // ── Certificado Digital A1 ────────────────────────────────────────
  @Column({ type: 'text',    name: 'certificado_base64',   nullable: true }) certificadoBase64: string | null;
  @Column({ ...vc(100),      name: 'certificado_senha'               }) certificadoSenha: string | null;
  @Column({ ...vc(10),       name: 'certificado_validade'            }) certificadoValidade: string | null;
  @Column({ ...vc(100),      name: 'certificado_nome'                }) certificadoNome: string | null;
}
