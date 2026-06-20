import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Bill } from '../bills/entities/bill.entity';
import { ProductMovement } from '../products/entities/product-movement.entity';
import { Product } from '../products/entities/product.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { UsersModule } from '../users/users.module';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderItem, Supplier, Product, Bill, ProductMovement]),
    UsersModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, RolesGuard],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
