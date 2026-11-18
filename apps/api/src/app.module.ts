import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './database/seed.service';
import { SeedModule } from './database/seed.module';
import { Activity, Company, Contact, Deal, Pipeline, Stage } from './database/entities';
import { ActivitiesModule } from './modules/activities/activities.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DealsModule } from './modules/deals/deals.module';
import { PipelinesModule } from './modules/pipelines/pipelines.module';

// Keep the database in the repository root regardless of which workspace script starts the API.
const databasePath = resolve(__dirname, '..', '..', '..', 'data', 'crm.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: databasePath,
      entities: [Company, Contact, Deal, Pipeline, Stage, Activity],
      synchronize: true,
      logging: false,
    }),
    PipelinesModule,
    CompaniesModule,
    ContactsModule,
    DealsModule,
    ActivitiesModule,
    DashboardModule,
    SeedModule,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly seed: SeedService) {}

  async onApplicationBootstrap() {
    await this.seed.seed();
  }
}
