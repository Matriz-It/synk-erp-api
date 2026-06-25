import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../core/enums/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { UpsertTenantConfigDto } from './dto/upsert-tenant-config.dto';
import { TenantConfigService } from './tenant-config.service';

@Controller('tenant-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROPRIETARIO, UserRole.ADMIN)
export class TenantConfigController {
  constructor(private readonly service: TenantConfigService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.service.getForApi(user.tenantId);
  }

  @Patch()
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertTenantConfigDto) {
    return this.service.upsertForApi(user.tenantId, dto);
  }
}
