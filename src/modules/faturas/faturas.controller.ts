import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipBillingGate } from '../../common/decorators/skip-billing-gate.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../core/enums/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { PagarFaturaDto } from './dto/pagar-fatura.dto';
import { UpdatePlanoDto } from './dto/update-plano.dto';
import { FaturasService } from './faturas.service';

@Controller('faturas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROPRIETARIO, UserRole.ADMIN, UserRole.FINANCEIRO)
@SkipBillingGate()
export class FaturasController {
  constructor(private readonly service: FaturasService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.service.list(u.tenantId);
  }

  @Get('status')
  status(@CurrentUser() u: AuthUser) {
    return this.service.getStatus(u.tenantId);
  }

  @Patch('plano')
  updatePlano(@CurrentUser() u: AuthUser, @Body() dto: UpdatePlanoDto) {
    return this.service.updatePlano(u.tenantId, dto);
  }

  @Post(':id/pagamento')
  pagar(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: PagarFaturaDto) {
    return this.service.pagar(id, u.tenantId, dto);
  }
}
