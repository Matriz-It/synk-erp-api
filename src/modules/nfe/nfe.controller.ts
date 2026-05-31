import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { CreateNfeDto } from './dto/create-nfe.dto';
import { ListNfesDto } from './dto/list-nfes.dto';
import { UpdateNfeDto } from './dto/update-nfe.dto';
import { NfeService } from './nfe.service';

@Controller('nfes')
@UseGuards(JwtAuthGuard)
export class NfeController {
  constructor(private readonly service: NfeService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListNfesDto) {
    return this.service.list(user.tenantId, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateNfeDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateNfeDto,
  ) {
    return this.service.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, user.tenantId);
  }
}
