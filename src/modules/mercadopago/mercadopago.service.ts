import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPago, {
  InvalidWebhookSignatureError,
  Payment,
  WebhookSignatureValidator,
} from 'mercadopago';
import type { PaymentCreateRequest } from 'mercadopago/dist/clients/payment/create/types';
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';

interface CreatePaymentParams {
  transactionAmount: number;
  description: string;
  paymentMethodId: string;
  token?: string;
  installments?: number;
  issuerId?: number;
  payerEmail: string;
  payerIdentification?: { type: string; number: string };
  externalReference: string;
  idempotencyKey: string;
}

interface VerifyWebhookParams {
  xSignature: string | string[] | undefined;
  xRequestId: string | string[] | undefined;
  dataId: string | string[] | undefined;
  toleranceSeconds?: number;
}

@Injectable()
export class MercadoPagoService {
  private readonly client: MercadoPago;
  private readonly payment: Payment;

  constructor(private readonly config: ConfigService) {
    this.client = new MercadoPago({
      accessToken: this.config.getOrThrow<string>('app.mercadopago.accessToken'),
      options: { timeout: 8000 },
    });
    this.payment = new Payment(this.client);
  }

  createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    const body: PaymentCreateRequest = {
      transaction_amount: params.transactionAmount,
      description: params.description,
      payment_method_id: params.paymentMethodId,
      token: params.token,
      installments: params.installments,
      issuer_id: params.issuerId,
      external_reference: params.externalReference,
      notification_url: `${this.config.getOrThrow<string>('app.url')}/webhooks/mercadopago`,
      payer: {
        email: params.payerEmail,
        identification: params.payerIdentification,
      },
    };
    return this.payment.create({ body, requestOptions: { idempotencyKey: params.idempotencyKey } });
  }

  getPayment(id: string): Promise<PaymentResponse> {
    return this.payment.get({ id });
  }

  /** Lança UnauthorizedException se a assinatura do webhook não bater. */
  verifyWebhookSignature(params: VerifyWebhookParams): void {
    try {
      WebhookSignatureValidator.validate({
        xSignature: params.xSignature,
        xRequestId: params.xRequestId,
        dataId: params.dataId,
        secret: this.config.getOrThrow<string>('app.mercadopago.webhookSecret'),
        toleranceSeconds: params.toleranceSeconds,
      });
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        throw new UnauthorizedException(`Webhook inválido: ${err.reason}`);
      }
      throw err;
    }
  }
}
