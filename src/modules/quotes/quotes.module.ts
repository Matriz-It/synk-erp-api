import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Client } from '../clients/entities/client.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { QuoteItem } from './entities/quote-item.entity';
import { Quote } from './entities/quote.entity';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, QuoteItem, Product, Client, Order, OrderItem])],
  controllers: [QuotesController],
  providers: [QuotesService, RolesGuard],
  exports: [QuotesService],
})
export class QuotesModule {}
