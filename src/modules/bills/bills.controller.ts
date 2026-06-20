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
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { ListBillsDto } from './dto/list-bills.dto';
import { PayBillDto } from './dto/pay-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

@Controller('bills')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROPRIETARIO, UserRole.ADMIN, UserRole.FINANCEIRO)
export class BillsController {
  constructor(private readonly service: BillsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser, @Query() q: ListBillsDto) {
    return this.service.list(u.tenantId, q);
  }

  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateBillDto) {
    return this.service.create(u.tenantId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.findOne(id, u.tenantId);
  }

  @Patch(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateBillDto) {
    return this.service.update(id, u.tenantId, dto);
  }

  @Post(':id/pay')
  pay(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: PayBillDto) {
    return this.service.pay(id, u.tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, u.tenantId);
  }
}
