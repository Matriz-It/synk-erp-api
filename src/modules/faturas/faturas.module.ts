import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantBillingGuard } from '../../common/guards/tenant-billing.guard';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Fatura } from './entities/fatura.entity';
import { FaturasAdminController } from './faturas-admin.controller';
import { FaturasBillingCron } from './faturas-billing.cron';
import { FaturasController } from './faturas.controller';
import { FaturasService } from './faturas.service';
import { MercadoPagoWebhookController } from './mercadopago-webhook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Fatura, Tenant]), JwtModule.register({}), MercadoPagoModule],
  controllers: [FaturasController, FaturasAdminController, MercadoPagoWebhookController],
  providers: [
    FaturasService,
    RolesGuard,
    FaturasBillingCron,
    { provide: APP_GUARD, useClass: TenantBillingGuard },
  ],
  exports: [FaturasService],
})
export class FaturasModule {}
