import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Activity, Company, Contact, Deal, Lead, Note, Pipeline, Stage } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Pipeline, Stage, Company, Contact, Deal, Activity, Lead, Note])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
