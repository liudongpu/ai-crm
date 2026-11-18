import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedModule } from './database/seed.module';
import { SeedService } from './database/seed.service';
import {
  Client,
  Communication,
  ConflictCheck,
  Contact,
  Document,
  Expense,
  Invoice,
  Lead,
  Matter,
  MatterStage,
  Note,
  Payment,
  Task,
  TimeEntry,
  TrustTransaction,
  User,
} from './database/entities';
import { ClientsModule } from './modules/clients/clients.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { ConflictsModule } from './modules/conflicts/conflicts.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { LeadsModule } from './modules/leads/leads.module';
import { MattersModule } from './modules/matters/matters.module';
import { NotesModule } from './modules/notes/notes.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SearchModule } from './modules/search/search.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';
import { TrustTransactionsModule } from './modules/trust-transactions/trust-transactions.module';
import { UsersModule } from './modules/users/users.module';

const databasePath = resolve(__dirname, '..', '..', '..', 'data', 'crm.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

const webDistPath = resolve(__dirname, '..', '..', 'web', 'dist');
const shouldServeWeb = existsSync(join(webDistPath, 'index.html'));

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: databasePath,
      entities: [
        User,
        Client,
        Contact,
        MatterStage,
        Matter,
        Lead,
        ConflictCheck,
        Task,
        Document,
        TimeEntry,
        Expense,
        Invoice,
        Payment,
        TrustTransaction,
        Communication,
        Note,
      ],
      synchronize: true,
      logging: false,
    }),
    UsersModule,
    ClientsModule,
    ContactsModule,
    MattersModule,
    LeadsModule,
    ConflictsModule,
    TasksModule,
    DocumentsModule,
    TimeEntriesModule,
    ExpensesModule,
    InvoicesModule,
    PaymentsModule,
    TrustTransactionsModule,
    CommunicationsModule,
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
