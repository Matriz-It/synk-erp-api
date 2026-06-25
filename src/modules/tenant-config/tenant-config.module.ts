import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantConfig } from './entities/tenant-config.entity';
import { TenantConfigController } from './tenant-config.controller';
import { TenantConfigService } from './tenant-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantConfig])],
  controllers: [TenantConfigController],
  providers: [TenantConfigService, RolesGuard],
  exports: [TenantConfigService],
})
export class TenantConfigModule {}
