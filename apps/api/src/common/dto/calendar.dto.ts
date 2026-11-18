import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  DEADLINE_STATUSES,
  DRAFT_EVENT_STATUSES,
  REMINDER_CHANNELS,
  REMINDER_STATUSES,
  STATUTE_STATUSES,
  TASK_PRIORITIES,
  TASK_TYPES,
  TaskPriority,
  TaskType,
} from '../../database/entities';

export class CalendarEventQueryDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @IsOptional()
  @IsString()
  calendarId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @IsIn(TASK_TYPES)
  type?: TaskType;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateCalendarEventDto {
  @IsString()
  title: string;

  @IsIn(TASK_TYPES)
  type: TaskType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsString()
  calendarId?: string;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @IsInt()
  reminderMinutes?: number;

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriority;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sourceId?: number;

  @IsOptional()
  @IsString()
  sourceDetail?: string;
}

export class UpdateCalendarEventDto extends PartialType(CreateCalendarEventDto) {}

export class CalendarOverviewQueryDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

export class RuleStepDto {
  @IsString()
  code: string;

  @IsString()
  label: string;

  @IsNumber()
  offsetDays: number;

  @IsOptional()
  @IsString()
  base?: string;

  @IsOptional()
  @IsBoolean()
  businessDays?: boolean;
}

export class CreateRuleDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleStepDto)
  steps: RuleStepDto[];
}

export class UpdateRuleDto extends PartialType(CreateRuleDto) {}

export class CreateHolidayDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  jurisdiction?: string;
}

export class CalculateDeadlineDto {
  @Type(() => Number)
  @IsInt()
  ruleId: number;

  @Type(() => Date)
  @IsDate()
  triggerDate: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ownerId?: number;
}

export class DeadlineQueryDto {
  @IsOptional()
  @IsIn(DEADLINE_STATUSES)
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;
}

export class UpdateTriggerDto {
  @Type(() => Date)
  @IsDate()
  triggerDate: Date;
}

export class UpdateDeadlineStatusDto {
  @IsIn(DEADLINE_STATUSES)
  status: string;
}

export class CreateStatuteDto {
  @IsString()
  title: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @Type(() => Date)
  @IsDate()
  causeDate: Date;

  @Type(() => Number)
  @IsInt()
  periodDays: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  alertDays?: number;

  @IsOptional()
  @IsIn(STATUTE_STATUSES)
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ownerId?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateStatuteDto extends PartialType(CreateStatuteDto) {}

export class StatuteQueryDto {
  @IsOptional()
  @IsIn(STATUTE_STATUSES)
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ExtractDatesDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  documentId?: number;

  @IsOptional()
  @IsString()
  sourceName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;
}

export class DraftQueryDto {
  @IsOptional()
  @IsIn(DRAFT_EVENT_STATUSES)
  status?: string;
}

export class UpdateDraftDto {
  @IsIn(['confirmed', 'dismissed'])
  status: 'confirmed' | 'dismissed';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;
}

export class IcsQueryDto {
  @IsOptional()
  @IsString()
  calendarId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}

export class ImportIcsDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  calendarId?: string;
}

export class ReminderQueryDto {
  @IsOptional()
  @IsIn(REMINDER_STATUSES)
  status?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

export class CreateReminderDto {
  @Type(() => Number)
  @IsInt()
  taskId: number;

  @IsIn(REMINDER_CHANNELS)
  channel: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @Type(() => Number)
  @IsInt()
  leadMinutes: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsIn(REMINDER_STATUSES)
  status?: string;
}

export class UpdateReminderDto {
  @IsOptional()
  @IsIn(REMINDER_CHANNELS)
  channel?: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  leadMinutes?: number;

  @IsOptional()
  @IsIn(REMINDER_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class TimeLinkQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

export class CreateTimeLinkDto {
  @Type(() => Number)
  @IsInt()
  taskId: number;

  @IsNumber()
  @Min(0)
  hours: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;
}
