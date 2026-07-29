import { SetMetadata } from '@nestjs/common';

export const SKIP_BILLING_GATE_KEY = 'skipBillingGate';

/** Isenta uma rota/controller da trava por inadimplência (TenantBillingGuard). */
export const SkipBillingGate = () => SetMetadata(SKIP_BILLING_GATE_KEY, true);
