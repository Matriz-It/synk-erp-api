import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FaturasService } from './faturas.service';

@Injectable()
export class FaturasBillingCron {
  private readonly logger = new Logger(FaturasBillingCron.name);

  constructor(private readonly service: FaturasService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async gerarFaturasIniciais(): Promise<void> {
    const total = await this.service.gerarFaturasIniciais();
    if (total > 0) {
      this.logger.log(`${total} fatura(s) inicial(is) gerada(s) para tenants com trial expirado.`);
    }
  }
}
