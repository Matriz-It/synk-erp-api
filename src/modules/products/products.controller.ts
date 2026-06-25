import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../core/enums/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ListAllMovementsDto } from './dto/list-all-movements.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { SaveComponentsDto } from './dto/save-components.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROPRIETARIO, UserRole.ADMIN, UserRole.VENDEDOR)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListProductsDto) {
    return this.service.list(user.tenantId, query);
  }

  // Rota estática deve vir ANTES da rota dinâmica :id
  @Get('movements')
  listAllMovements(@CurrentUser() user: AuthUser, @Query() query: ListAllMovementsDto) {
    return this.service.listAllMovements(user.tenantId, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.service.create(user.tenantId, user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(id, user.tenantId, dto);
  }

  @Post(':id/movements')
  createMovement(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateMovementDto,
  ) {
    return this.service.createMovement(id, user.tenantId, user.id, dto);
  }

  @Get(':id/movements')
  listMovements(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.listMovements(id, user.tenantId);
  }

  @Get(':id/components')
  listComponents(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.listComponents(id, user.tenantId);
  }

  @Put(':id/components')
  saveComponents(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SaveComponentsDto,
  ) {
    return this.service.saveComponents(id, user.tenantId, dto);
  }
}
