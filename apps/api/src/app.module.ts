import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './database/seed.service';
import { SeedModule } from './database/seed.module';
import { Activity, Company, Contact, Deal, Lead, Note, Pipeline, Stage } from './database/entities';
import { ActivitiesModule } from './modules/activities/activities.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DealsModule } from './modules/deals/deals.module';
import { LeadsModule } from './modules/leads/leads.module';
import { NotesModule } from './modules/notes/notes.module';
import { PipelinesModule } from './modules/pipelines/pipelines.module';
import { SearchModule } from './modules/search/search.module';

// Keep the database in the repository root regardless of which workspace script starts the API.
const databasePath = resolve(__dirname, '..', '..', '..', 'data', 'crm.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

// When the web app has been built, serve it from the same origin as the API.
const webDistPath = resolve(__dirname, '..', '..', 'web', 'dist');
const shouldServeWeb = existsSync(join(webDistPath, 'index.html'));

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: databasePath,
      entities: [Company, Contact, Deal, Pipeline, Stage, Activity, Lead, Note],
      synchronize: true,
      logging: false,
    }),
    PipelinesModule,
    CompaniesModule,
    ContactsModule,
    DealsModule,
    ActivitiesModule,
    LeadsModule,
    NotesModule,
    SearchModule,
    DashboardModule,
    SeedModule,
    ...(shouldServeWeb
      ? [ServeStaticModule.forRoot({ rootPath: webDistPath, exclude: ['/api/{*splat}'] })]
      : []),
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly seed: SeedService) {}

  async onApplicationBootstrap() {
    await this.seed.seed();
  }
}
