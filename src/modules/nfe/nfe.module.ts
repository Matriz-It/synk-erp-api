import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity';
import { NfeItem } from './entities/nfe-item.entity';
import { NfeVencimento } from './entities/nfe-vencimento.entity';
import { Nfe } from './entities/nfe.entity';
import { NfeController } from './nfe.controller';
import { NfeService } from './nfe.service';

@Module({
  imports: [TypeOrmModule.forFeature([Nfe, NfeItem, NfeVencimento, Client])],
  controllers: [NfeController],
  providers: [NfeService],
  exports: [NfeService],
})
export class NfeModule {}
