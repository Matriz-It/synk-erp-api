import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantConfig } from './entities/tenant-config.entity';
import { TenantConfigController } from './tenant-config.controller';
import { TenantConfigService } from './tenant-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantConfig, Tenant])],
  controllers: [TenantConfigController],
  providers: [TenantConfigService, RolesGuard],
  exports: [TenantConfigService],
})
export class TenantConfigModule {}
