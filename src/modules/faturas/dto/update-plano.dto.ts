import { IsIn } from 'class-validator';
import { TenantPlan } from '../../../core/enums/enums';

/**
 * Personalizado não entra aqui de propósito — é preço negociado, escolhido
 * via contato comercial, não self-service.
 */
export class UpdatePlanoDto {
  @IsIn([TenantPlan.PRO, TenantPlan.BUSINESS])
  plan: TenantPlan.PRO | TenantPlan.BUSINESS;
}
