import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CICLO_DIAS, PLAN_PRICE } from '../../core/constants/billing.constants';
import { FaturaStatus, TenantPlan } from '../../core/enums/enums';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { MarcarPagoDto } from './dto/marcar-pago.dto';
import { PagarFaturaDto } from './dto/pagar-fatura.dto';
import { UpdatePlanoDto } from './dto/update-plano.dto';
import { Fatura } from './entities/fatura.entity';

@Injectable()
export class FaturasService {
  constructor(
    @InjectRepository(Fatura)
    private readonly repo: Repository<Fatura>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly mercadoPago: MercadoPagoService,
  ) {}

  async list(tenantId: string) {
    const faturas = await this.repo.find({ where: { tenantId }, order: { numero: 'DESC' } });
    return faturas.map((f) => this.mapFatura(f));
  }

  async isBlocked(tenantId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const overdue = await this.repo
      .createQueryBuilder('f')
      .where('f.tenant_id = :tenantId', { tenantId })
      .andWhere('f.status = :st', { st: FaturaStatus.PENDENTE })
      .andWhere('f.vencimento <= :today', { today })
      .getCount();
    return overdue > 0;
  }

  async getStatus(tenantId: string) {
    const [tenant, blocked, faturaAtual] = await Promise.all([
      this.tenantRepo.findOneBy({ id: tenantId }),
      this.isBlocked(tenantId),
      this.repo.findOne({ where: { tenantId, status: FaturaStatus.PENDENTE }, order: { vencimento: 'ASC' } }),
    ]);

    const trialEndsAt = tenant?.trialEndsAt ?? null;
    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : null;

    return {
      blocked,
      trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
      trialDaysLeft,
      faturaAtual: faturaAtual ? this.mapFatura(faturaAtual) : null,
    };
  }

  async marcarPago(id: string, dto: MarcarPagoDto, mpTags?: { mpPaymentId?: string }) {
    const fatura = await this.repo.findOneBy({ id });
    if (!fatura) throw new NotFoundException('Fatura não encontrada');
    if (fatura.status === FaturaStatus.PAGO) return this.mapFatura(fatura);

    fatura.status = FaturaStatus.PAGO;
    fatura.pagoEm = dto.pagoEm ?? new Date().toISOString().split('T')[0];
    fatura.valorPago = dto.valorPago ?? fatura.valor;
    if (mpTags?.mpPaymentId) fatura.mpPaymentId = mpTags.mpPaymentId;
    const paga = await this.repo.save(fatura);

    // Ao baixar, gera automaticamente a fatura do próximo ciclo — usa o plano
    // atual do tenant (não o valor da fatura paga), pra refletir eventual troca de plano.
    const tenant = await this.tenantRepo.findOneBy({ id: fatura.tenantId });
    const proximoCicloInicio = this.addDays(fatura.cicloFim, 1);
    const proximoCicloFim = this.addDays(proximoCicloInicio, CICLO_DIAS);
    const proxima = await this.repo.save(
      this.repo.create({
        numero: await this.nextNumero(fatura.tenantId),
        cicloInicio: proximoCicloInicio,
        cicloFim: proximoCicloFim,
        vencimento: proximoCicloInicio,
        valor: tenant ? PLAN_PRICE[tenant.plan] : fatura.valor,
        status: FaturaStatus.PENDENTE,
        tenantId: fatura.tenantId,
      }),
    );

    return { ...this.mapFatura(paga), proxima: this.mapFatura(proxima) };
  }

  /** Troca o plano e garante que existe uma fatura pendente refletindo o novo valor. */
  async updatePlano(tenantId: string, dto: UpdatePlanoDto) {
    await this.tenantRepo.update({ id: tenantId }, { plan: dto.plan });

    const pendente = await this.repo.findOne({ where: { tenantId, status: FaturaStatus.PENDENTE } });
    if (pendente) {
      pendente.valor = PLAN_PRICE[dto.plan];
      const salva = await this.repo.save(pendente);
      return { plan: dto.plan, fatura: this.mapFatura(salva) };
    }

    const tenant = await this.tenantRepo.findOneBy({ id: tenantId });
    const today = new Date().toISOString().split('T')[0];
    const trialEndsAt = tenant?.trialEndsAt ? tenant.trialEndsAt.toISOString().split('T')[0] : null;
    const cicloInicio = trialEndsAt && trialEndsAt > today ? trialEndsAt : today;
    const cicloFim = this.addDays(cicloInicio, CICLO_DIAS);

    const criada = await this.repo.save(
      this.repo.create({
        numero: await this.nextNumero(tenantId),
        cicloInicio,
        cicloFim,
        vencimento: cicloInicio,
        valor: PLAN_PRICE[dto.plan],
        status: FaturaStatus.PENDENTE,
        tenantId,
      }),
    );
    return { plan: dto.plan, fatura: this.mapFatura(criada) };
  }

  /** Paga uma fatura específica via Mercado Pago (PIX, boleto ou cartão). */
  async pagar(id: string, tenantId: string, dto: PagarFaturaDto) {
    const fatura = await this.repo.findOneBy({ id, tenantId });
    if (!fatura) throw new NotFoundException('Fatura não encontrada');
    if (fatura.status !== FaturaStatus.PENDENTE) {
      throw new ConflictException('Fatura já paga ou cancelada');
    }

    const resposta = await this.mercadoPago.createPayment({
      transactionAmount: fatura.valor, // nunca confiar em valor vindo do cliente
      description: `Synk ERP — Fatura #${fatura.numero}`,
      paymentMethodId: dto.paymentMethodId,
      token: dto.token,
      installments: dto.installments,
      issuerId: dto.issuerId,
      payerEmail: dto.payerEmail,
      payerIdentification: dto.payerIdentification,
      externalReference: fatura.id,
      idempotencyKey: fatura.id,
    });

    const mpPaymentId = resposta.id ? String(resposta.id) : null;
    if (mpPaymentId) {
      fatura.mpPaymentId = mpPaymentId;
      await this.repo.save(fatura);
    }

    const faturaFinal = resposta.status === 'approved'
      ? await this.marcarPago(fatura.id, { valorPago: resposta.transaction_amount }, { mpPaymentId: mpPaymentId ?? undefined })
      : this.mapFatura(fatura);

    const transactionData = resposta.point_of_interaction?.transaction_data;
    const transactionDetails = resposta.transaction_details;

    return {
      status: resposta.status ?? 'pending',
      statusDetail: resposta.status_detail,
      mpPaymentId,
      pix: transactionData?.qr_code
        ? { qrCode: transactionData.qr_code, qrCodeBase64: transactionData.qr_code_base64 ?? null }
        : undefined,
      boleto: transactionDetails?.digitable_line || transactionDetails?.external_resource_url
        ? {
            barcode: transactionDetails?.barcode?.content,
            digitableLine: transactionDetails?.digitable_line,
            url: transactionDetails?.external_resource_url,
          }
        : undefined,
      fatura: faturaFinal,
    };
  }

  /** Faz a fatura pendente do tenant vencer hoje (ou cria uma) — fallback de ops pra travar o acesso manualmente. */
  async forcarVencimentoImediato(tenantId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const pendente = await this.repo.findOne({ where: { tenantId, status: FaturaStatus.PENDENTE } });
    if (pendente) {
      if (pendente.vencimento > today) {
        pendente.vencimento = today;
        await this.repo.save(pendente);
      }
      return;
    }

    const tenant = await this.tenantRepo.findOneBy({ id: tenantId });
    await this.repo.save(
      this.repo.create({
        numero: await this.nextNumero(tenantId),
        cicloInicio: today,
        cicloFim: this.addDays(today, CICLO_DIAS),
        vencimento: today,
        valor: tenant ? PLAN_PRICE[tenant.plan] : PLAN_PRICE[TenantPlan.PRO],
        status: FaturaStatus.PENDENTE,
        tenantId,
      }),
    );
  }

  /** Gera a primeira fatura para tenants cujo trial expirou e que ainda não têm nenhuma. */
  async gerarFaturasIniciais(): Promise<number> {
    const tenants: { id: string; trial_ends_at: string; plan: TenantPlan }[] = await this.tenantRepo.query(
      `SELECT t.id, t.trial_ends_at, t.plan FROM tenants t
       WHERE t.trial_ends_at IS NOT NULL AND t.trial_ends_at <= NOW()
       AND NOT EXISTS (SELECT 1 FROM faturas f WHERE f.tenant_id = t.id)`,
    );

    for (const t of tenants) {
      const cicloInicio = new Date(t.trial_ends_at).toISOString().split('T')[0];
      const cicloFim = this.addDays(cicloInicio, CICLO_DIAS);
      await this.repo.save(
        this.repo.create({
          numero: 1,
          cicloInicio,
          cicloFim,
          vencimento: cicloInicio,
          valor: PLAN_PRICE[t.plan] ?? PLAN_PRICE[TenantPlan.PRO],
          status: FaturaStatus.PENDENTE,
          tenantId: t.id,
        }),
      );
    }

    return tenants.length;
  }

  private async nextNumero(tenantId: string): Promise<number> {
    const result = await this.repo.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS next FROM faturas WHERE tenant_id = $1`,
      [tenantId],
    );
    return parseInt(result[0].next, 10);
  }

  /** Soma dias a uma data YYYY-MM-DD (UTC, evita bug de fuso). */
  private addDays(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split('T')[0];
  }

  private mapFatura(f: Fatura) {
    return {
      id: f.id,
      numero: f.numero,
      cicloInicio: f.cicloInicio,
      cicloFim: f.cicloFim,
      vencimento: f.vencimento,
      valor: f.valor,
      status: f.status,
      pagoEm: f.pagoEm ?? undefined,
      valorPago: f.valorPago ?? undefined,
      criadoEm: f.createdAt.toISOString().split('T')[0],
    };
  }
}
