import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../core/enums/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { ReceivablesService } from './receivables.service';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { ListReceivablesDto } from './dto/list-receivables.dto';
import { ReceiveReceivableDto } from './dto/receive-receivable.dto';
import { UpdateReceivableDto } from './dto/update-receivable.dto';

@Controller('receivables')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROPRIETARIO, UserRole.ADMIN, UserRole.FINANCEIRO)
export class ReceivablesController {
  constructor(private readonly service: ReceivablesService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: ListReceivablesDto) {
    return this.service.list(u.tenantId, q);
  }

  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateReceivableDto) {
    return this.service.create(u.tenantId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.findOne(id, u.tenantId);
  }

  @Patch(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateReceivableDto) {
    return this.service.update(id, u.tenantId, dto);
  }

  @Post(':id/receive')
  receive(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: ReceiveReceivableDto) {
    return this.service.receive(id, u.tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, u.tenantId);
  }
}
