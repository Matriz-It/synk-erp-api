import {
  Body, Controller, Headers, Param, Post, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipBillingGate } from '../../common/decorators/skip-billing-gate.decorator';
import { MarcarPagoDto } from './dto/marcar-pago.dto';
import { FaturasService } from './faturas.service';

/**
 * Rotas internas de operação — sem gateway de pagamento ainda, a baixa é feita
 * manualmente pelo operador da plataforma após confirmar o pagamento fora do
 * sistema (PIX/transferência). Protegidas por segredo compartilhado, não por
 * JWT de tenant (não há usuário-tenant envolvido nessa ação).
 */
@Controller('internal/faturas')
@SkipBillingGate()
export class FaturasAdminController {
  constructor(
    private readonly service: FaturasService,
    private readonly config: ConfigService,
  ) {}

  @Post(':id/marcar-pago')
  marcarPago(
    @Headers('x-admin-secret') secret: string,
    @Param('id') id: string,
    @Body() dto: MarcarPagoDto,
  ) {
    this.checkSecret(secret);
    return this.service.marcarPago(id, dto);
  }

  /** Dispara a geração das faturas iniciais na hora, sem esperar o cron da 1h — útil para testes. */
  @Post('gerar')
  async gerar(@Headers('x-admin-secret') secret: string) {
    this.checkSecret(secret);
    const total = await this.service.gerarFaturasIniciais();
    return { geradas: total };
  }

  private checkSecret(secret: string): void {
    if (secret !== this.config.getOrThrow<string>('app.billing.adminSecret')) {
      throw new UnauthorizedException('Segredo inválido');
    }
  }
}
