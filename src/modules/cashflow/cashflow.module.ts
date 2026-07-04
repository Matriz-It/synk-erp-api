import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Bill } from '../bills/entities/bill.entity';
import { Receivable } from '../receivables/entities/receivable.entity';
import { CashflowController } from './cashflow.controller';
import { CashflowService } from './cashflow.service';
import { CashEntry } from './entities/cash-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, Receivable, CashEntry])],
  controllers: [CashflowController],
  providers: [CashflowService, RolesGuard],
})
export class CashflowModule {}
