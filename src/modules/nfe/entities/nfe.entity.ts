import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { NFeModalidadeFrete, NFeStatus } from '../../../core/enums/enums';
import { Client } from '../../clients/entities/client.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { NfeItem } from './nfe-item.entity';
import { NfeVencimento } from './nfe-vencimento.entity';

const dec = (precision = 14, scale = 2) => ({
  type: 'decimal' as const,
  precision,
  scale,
  transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
});

@Entity('nfes')
export class Nfe extends BaseEntity {
  @Column()
  numero: number;

  @Column({ type: 'varchar', length: 3, default: '1' })
  serie: string;

  @Column({ type: 'varchar', length: 10, name: 'data_emissao' })
  dataEmissao: string;

  @Column({ type: 'varchar', length: 10, name: 'data_saida', nullable: true })
  dataSaida: string | null;

  @Column({ type: 'varchar', length: 120, name: 'natureza_operacao' })
  naturezaOperacao: string;

  @Column({ type: 'varchar', length: 20 })
  finalidade: string;

  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ type: 'enum', enum: NFeStatus, default: NFeStatus.RASCUNHO })
  status: NFeStatus;

  @Column({ type: 'varchar', length: 44, name: 'chave_acesso', nullable: true })
  chaveAcesso: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  protocolo: string | null;

  // — Valores fiscais —
  @Column({ name: 'base_icms', ...dec(), default: 0 })
  baseICMS: number;

  @Column({ name: 'valor_icms', ...dec(), default: 0 })
  valorICMS: number;

  @Column({ name: 'base_ibs', ...dec(), default: 0 })
  baseIBS: number;

  @Column({ name: 'valor_ibs', ...dec(), default: 0 })
  valorIBS: number;

  @Column({ name: 'valor_cbs', ...dec(), default: 0 })
  valorCBS: number;

  // — Totais —
  @Column({ name: 'valor_frete', ...dec(), default: 0 })
  valorFrete: number;

  @Column({ name: 'valor_seguro', ...dec(), default: 0 })
  valorSeguro: number;

  @Column({ name: 'valor_desconto', ...dec(), default: 0 })
  valorDesconto: number;

  @Column({ name: 'valor_outro', ...dec(), default: 0 })
  valorOutro: number;

  @Column({ name: 'valor_total', ...dec(), default: 0 })
  valorTotal: number;

  // — Frete —
  @Column({
    type: 'enum',
    enum: NFeModalidadeFrete,
    name: 'modalidade_frete',
    default: NFeModalidadeFrete.SEM_FRETE,
  })
  modalidadeFrete: NFeModalidadeFrete;

  @Column({ type: 'varchar', length: 120, nullable: true })
  transportadora: string | null;

  @Column({ type: 'varchar', length: 8, name: 'placa_veiculo', nullable: true })
  placaVeiculo: string | null;

  @Column({ name: 'peso_liquido', ...dec(10, 3), nullable: true })
  pesoLiquido: number | null;

  @Column({ name: 'peso_bruto', ...dec(10, 3), nullable: true })
  pesoBruto: number | null;

  @Column({ type: 'int', name: 'qtd_volumes', nullable: true })
  qtdVolumes: number | null;

  @Column({ type: 'varchar', length: 60, name: 'especie_volumes', nullable: true })
  especieVolumes: string | null;

  // — Observações —
  @Column({ type: 'text', name: 'obs_contribuinte', nullable: true })
  obsContribuinte: string | null;

  @Column({ type: 'text', name: 'obs_fisco', nullable: true })
  obsFisco: string | null;

  // — Complementar —
  @Column({ type: 'varchar', length: 60, name: 'numero_pedido', nullable: true })
  numeroPedido: string | null;

  @Column({ type: 'varchar', length: 60, name: 'numero_contrato', nullable: true })
  numeroContrato: string | null;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => NfeItem, (item) => item.nfe, { cascade: true })
  items: NfeItem[];

  @OneToMany(() => NfeVencimento, (v) => v.nfe, { cascade: true })
  vencimentos: NfeVencimento[];
}
