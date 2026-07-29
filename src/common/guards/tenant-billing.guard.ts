import {
  CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { FaturasService } from '../../modules/faturas/faturas.service';
import { SKIP_BILLING_GATE_KEY } from '../decorators/skip-billing-gate.decorator';

interface DecodedTenantToken {
  tenantId?: string;
}

/**
 * Guard global: bloqueia toda a API quando o tenant tem fatura vencida e não
 * paga. Roda antes do JwtAuthGuard (que é por-controller, não global), então
 * decodifica o token ele mesmo só para extrair o tenantId — qualquer ausência
 * ou falha de token é deixada passar (`return true`) para que o guard de
 * autenticação de cada controller faça a rejeição de verdade. Este guard só
 * cuida de cobrança, nunca de autenticação.
 */
@Injectable()
export class TenantBillingGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly faturasService: FaturasService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_BILLING_GATE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) return true;

    let payload: DecodedTenantToken;
    try {
      payload = await this.jwtService.verifyAsync<DecodedTenantToken>(authHeader.slice(7), {
        secret: this.config.getOrThrow<string>('app.jwt.accessSecret'),
      });
    } catch {
      return true;
    }

    if (!payload.tenantId) return true;

    const blocked = await this.faturasService.isBlocked(payload.tenantId);
    if (blocked) {
      throw new HttpException(
        'Assinatura pendente. Regularize o pagamento para continuar usando o sistema.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
