import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../core/enums/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { CashflowService } from './cashflow.service';
import { CreateCashEntryDto } from './dto/create-cash-entry.dto';
import { GetCashflowDto } from './dto/get-cashflow.dto';

@Controller('cashflow')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROPRIETARIO, UserRole.ADMIN, UserRole.FINANCEIRO)
export class CashflowController {
  constructor(private readonly service: CashflowService) {}

  @Get()
  get(@CurrentUser() user: AuthUser, @Query() dto: GetCashflowDto) {
    return this.service.getCashflow(user.tenantId, dto);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCashEntryDto) {
    return this.service.createEntry(user.tenantId, dto);
  }
}
