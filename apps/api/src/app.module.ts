import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedModule } from './database/seed.module';
import { SeedService } from './database/seed.service';
import {
  CalendarDraftEvent,
  CalendarReminder,
  Client,
  Communication,
  ConflictCheck,
  Contact,
  CourtHoliday,
  CourtRule,
  DeadlineCalculation,
  Document,
  Expense,
  Feature,
  FeatureModule,
  FeatureRecord,
  Invoice,
  Lead,
  Matter,
  MatterParty,
  MatterStage,
  MatterCategory,
  MatterTeamMember,
  MessageTemplate,
  Note,
  Payment,
  RolePermission,
  Statute,
  Task,
  TaskTemplate,
  TimeEntry,
  ToolCalculation,
  TrustTransaction,
  User,
  WorkspaceItem,
  WorkspaceSetting,
} from './database/entities';
import { CalendarModule } from './modules/cases/calendar/calendar.module';
import { ClientsModule } from './modules/acquisition/clients/clients.module';
import { CommunicationsModule } from './modules/communication/communications/communications.module';
import { ConflictsModule } from './modules/acquisition/conflicts/conflicts.module';
import { ContactsModule } from './modules/acquisition/contacts/contacts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DocumentsModule } from './modules/cases/documents/documents.module';
import { ExpensesModule } from './modules/finance/expenses/expenses.module';
import { FeaturesModule } from './modules/platform/features/features.module';
import { InvoicesModule } from './modules/finance/invoices/invoices.module';
import { LeadsModule } from './modules/acquisition/leads/leads.module';
import { LegalAiModule } from './modules/platform/legal-ai/legal-ai.module';
import { LegalToolboxModule } from './modules/platform/legal-toolbox/legal-toolbox.module';
import { MattersModule } from './modules/cases/matters/matters.module';
import { NotesModule } from './modules/cases/notes/notes.module';
import { PaymentsModule } from './modules/finance/payments/payments.module';
import { MatterCategoriesModule } from './modules/settings/matter-categories/matter-categories.module';
import { PermissionsModule } from './modules/settings/permissions/permissions.module';
import { SearchModule } from './modules/platform/search/search.module';
import { TasksModule } from './modules/cases/tasks/tasks.module';
import { TimeEntriesModule } from './modules/finance/time-entries/time-entries.module';
import { TrustTransactionsModule } from './modules/finance/trust-transactions/trust-transactions.module';
import { UsersModule } from './modules/settings/users/users.module';
import { WorkspaceModule } from './modules/platform/workspace/workspace.module';

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
        MatterCategory,
        Matter,
        MatterParty,
        MatterTeamMember,
        Lead,
        ConflictCheck,
        Task,
        TaskTemplate,
        Document,
        TimeEntry,
        Expense,
        FeatureModule,
        Feature,
        FeatureRecord,
        Invoice,
        Payment,
        RolePermission,
        TrustTransaction,
        Communication,
        MessageTemplate,
        Note,
        CourtRule,
        CourtHoliday,
        DeadlineCalculation,
        Statute,
        CalendarDraftEvent,
        CalendarReminder,
        WorkspaceItem,
        WorkspaceSetting,
        ToolCalculation,
      ],
      synchronize: true,
      logging: false,
    }),
    UsersModule,
    CalendarModule,
    ClientsModule,
    ContactsModule,
    MattersModule,
    LeadsModule,
    ConflictsModule,
    TasksModule,
    DocumentsModule,
    TimeEntriesModule,
    ExpensesModule,
    FeaturesModule,
    InvoicesModule,
    PaymentsModule,
    MatterCategoriesModule,
    PermissionsModule,
    TrustTransactionsModule,
    CommunicationsModule,
    NotesModule,
    SearchModule,
    DashboardModule,
    WorkspaceModule,
    LegalAiModule,
    LegalToolboxModule,
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
