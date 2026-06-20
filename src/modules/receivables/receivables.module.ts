import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReceivablesController } from './receivables.controller';
import { ReceivablesService } from './receivables.service';
import { Receivable } from './entities/receivable.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Receivable])],
  controllers: [ReceivablesController],
  providers: [ReceivablesService, RolesGuard],
  exports: [ReceivablesService],
})
export class ReceivablesModule {}
