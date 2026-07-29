import { Body, Controller, Headers, HttpCode, Logger, Post, Query } from '@nestjs/common';
import { SkipBillingGate } from '../../common/decorators/skip-billing-gate.decorator';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import { FaturasService } from './faturas.service';

interface MercadoPagoWebhookBody {
  type?: string;
  action?: string;
  data?: { id?: string };
}

/**
 * Endpoint público (sem JWT) que o Mercado Pago chama pra notificar eventos
 * de pagamento. Autenticidade vem da assinatura HMAC (x-signature), não de
 * um token de usuário.
 */
@Controller('webhooks/mercadopago')
@SkipBillingGate()
export class MercadoPagoWebhookController {
  private readonly logger = new Logger(MercadoPagoWebhookController.name);

  constructor(
    private readonly mercadoPago: MercadoPagoService,
    private readonly faturas: FaturasService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Headers('x-signature') xSignature: string | undefined,
    @Headers('x-request-id') xRequestId: string | undefined,
    @Query('data.id') dataId: string | undefined,
    @Body() body: MercadoPagoWebhookBody,
  ) {
    this.mercadoPago.verifyWebhookSignature({ xSignature, xRequestId, dataId, toleranceSeconds: 300 });

    const id = dataId ?? body.data?.id;
    if (!id || body.type !== 'payment') return { received: true };

    try {
      const payment = await this.mercadoPago.getPayment(id);
      if (payment.status !== 'approved') return { received: true };

      const faturaId = payment.external_reference;
      if (!faturaId) {
        this.logger.warn(`Payment ${id} aprovado sem external_reference — não é possível associar a uma fatura.`);
        return { received: true };
      }

      // marcarPago já é idempotente: no-op se a fatura já estiver PAGO —
      // cobre reentrega de notificação pelo MP sem processar duas vezes.
      await this.faturas.marcarPago(
        faturaId,
        { valorPago: payment.transaction_amount },
        { mpPaymentId: String(id) },
      );
    } catch (err) {
      this.logger.error(`Erro processando webhook payment (id=${id}): ${(err as Error).message}`);
    }

    return { received: true };
  }
}
