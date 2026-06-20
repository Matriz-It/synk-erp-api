import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Bill } from '../bills/entities/bill.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Receivable } from '../receivables/entities/receivable.entity';
import { CashflowController } from './cashflow.controller';
import { CashflowService } from './cashflow.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, Receivable, Order, OrderItem])],
  controllers: [CashflowController],
  providers: [CashflowService, RolesGuard],
})
export class CashflowModule {}
