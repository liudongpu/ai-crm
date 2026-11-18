import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deal, Pipeline, Stage } from '../../database/entities';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';

@Module({
  imports: [TypeOrmModule.forFeature([Deal, Stage, Pipeline])],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
