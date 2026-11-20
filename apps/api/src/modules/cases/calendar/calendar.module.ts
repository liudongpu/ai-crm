import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CalendarDraftEvent,
  CalendarReminder,
  CourtHoliday,
  CourtRule,
  DeadlineCalculation,
  Document,
  Matter,
  Statute,
  Task,
  TimeEntry,
  User,
} from '../../../database/entities';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TimeEntry,
      Document,
      User,
      Matter,
      CourtRule,
      CourtHoliday,
      DeadlineCalculation,
      Statute,
      CalendarDraftEvent,
      CalendarReminder,
    ]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
