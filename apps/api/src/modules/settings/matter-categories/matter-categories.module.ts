import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatterCategory } from '../../../database/entities';
import { MatterCategoriesController } from './matter-categories.controller';
import { MatterCategoriesService } from './matter-categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([MatterCategory])],
  controllers: [MatterCategoriesController],
  providers: [MatterCategoriesService],
  exports: [MatterCategoriesService],
})
export class MatterCategoriesModule {}
