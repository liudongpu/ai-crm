import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrustTransaction } from '../../database/entities';
import { TrustTransactionsController } from './trust-transactions.controller';
import { TrustTransactionsService } from './trust-transactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([TrustTransaction])],
  controllers: [TrustTransactionsController],
  providers: [TrustTransactionsService],
  exports: [TrustTransactionsService],
})
export class TrustTransactionsModule {}
