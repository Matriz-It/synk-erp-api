import { TenantPlan } from '../enums/enums';

/** Duração do período de teste gratuito concedido a todo tenant no cadastro. */
export const TRIAL_DAYS = 14;

/** Duração de um ciclo de cobrança (dias cobertos por cada fatura). */
export const CICLO_DIAS = 30;

/** Valor cobrado por ciclo, conforme o plano do tenant. */
export const PLAN_PRICE: Record<TenantPlan, number> = {
  [TenantPlan.PRO]: 80,
  [TenantPlan.BUSINESS]: 189,
  [TenantPlan.PERSONALIZADO]: 349,
};
