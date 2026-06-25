import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('tenant_configs')
export class TenantConfig extends BaseEntity {
  @Column({ name: 'tenant_id', unique: true })
  tenantId: string;

  @OneToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ── Dados complementares da empresa ──────────────────────────────
  @Column({ name: 'nome_fantasia', length: 150, nullable: true })
  nomeFantasia: string | null;

  @Column({ length: 20, nullable: true })
  ie: string | null; // Inscrição Estadual

  @Column({ length: 20, nullable: true })
  im: string | null; // Inscrição Municipal

  @Column({ length: 10, nullable: true })
  cnae: string | null;

  @Column({ length: 20, nullable: true })
  telefone: string | null;

  @Column({ name: 'email_comercial', length: 100, nullable: true })
  emailComercial: string | null;

  // ── Endereço ──────────────────────────────────────────────────────
  @Column({ length: 9, nullable: true })
  cep: string | null;

  @Column({ length: 150, nullable: true })
  logradouro: string | null;

  @Column({ length: 20, nullable: true })
  numero: string | null;

  @Column({ length: 100, nullable: true })
  complemento: string | null;

  @Column({ length: 100, nullable: true })
  bairro: string | null;

  @Column({ length: 100, nullable: true })
  cidade: string | null;

  @Column({ length: 2, nullable: true })
  uf: string | null;

  // ── Configurações Fiscais / NFe ───────────────────────────────────
  @Column({ length: 1, nullable: true })
  crt: string | null; // 1=Simples Nacional 2=Simples c/Excesso 3=Regime Normal

  @Column({ name: 'serie_nfe', length: 3, nullable: true, default: '1' })
  serieNfe: string | null;

  @Column({ name: 'ambiente_nfe', length: 20, nullable: true, default: 'homologacao' })
  ambienteNfe: string | null; // 'homologacao' | 'producao'

  @Column({ name: 'cfop_padrao', length: 5, nullable: true })
  cfopPadrao: string | null; // ex: '5102'

  @Column({ name: 'cst_padrao', length: 3, nullable: true })
  cstPadrao: string | null; // CST ou CSOSN

  @Column({
    name: 'aliq_icms',
    type: 'decimal', precision: 5, scale: 2, nullable: true,
    transformer: { to: (v: number | null) => v, from: (v: string | null) => v !== null ? parseFloat(v) : null },
  })
  aliqIcms: number | null;

  @Column({
    name: 'aliq_ibs',
    type: 'decimal', precision: 5, scale: 2, nullable: true,
    transformer: { to: (v: number | null) => v, from: (v: string | null) => v !== null ? parseFloat(v) : null },
  })
  aliqIbs: number | null;

  @Column({
    name: 'aliq_cbs',
    type: 'decimal', precision: 5, scale: 2, nullable: true,
    transformer: { to: (v: number | null) => v, from: (v: string | null) => v !== null ? parseFloat(v) : null },
  })
  aliqCbs: number | null;

  @Column({ name: 'email_nfe', length: 100, nullable: true })
  emailNfe: string | null; // e-mail para envio dos XMLs

  // ── Certificado Digital A1 ────────────────────────────────────────
  @Column({ name: 'certificado_base64', type: 'text', nullable: true })
  certificadoBase64: string | null; // arquivo .pfx em base64

  @Column({ name: 'certificado_senha', length: 100, nullable: true })
  certificadoSenha: string | null;

  @Column({ name: 'certificado_validade', length: 10, nullable: true })
  certificadoValidade: string | null; // YYYY-MM-DD

  @Column({ name: 'certificado_nome', length: 100, nullable: true })
  certificadoNome: string | null;
}
