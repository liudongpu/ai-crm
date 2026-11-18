import { OmitType } from '@nestjs/mapped-types';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  CONFLICT_TYPES,
  INVOICE_STATUSES,
  MATTER_STATUSES,
  NOTE_TARGET_TYPES,
  TASK_TYPES,
} from '../../database/entities';
import { CreatePaymentDto } from './create-payment.dto';

const toBoolean = ({ value }: TransformFnParams) => value === true || value === 'true';

export class CheckConflictDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsIn(CONFLICT_TYPES)
  type?: (typeof CONFLICT_TYPES)[number];

  @IsOptional()
  @IsInt()
  matterId?: number;
}

export class ConvertLeadDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  practiceArea?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsString()
  title?: string;
}

export class UpdateMatterStageDto {
  @IsInt()
  stageId: number;

  @IsOptional()
  @IsInt()
  position?: number;
}

export class InvoicePaymentDto extends OmitType(CreatePaymentDto, ['invoiceId'] as const) {}

export class MatterQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stageId?: number;

  @IsOptional()
  @IsIn(MATTER_STATUSES)
  status?: (typeof MATTER_STATUSES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ownerId?: number;

  @IsOptional()
  @IsString()
  search?: string;
}

export class TaskQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsIn(TASK_TYPES)
  type?: (typeof TASK_TYPES)[number];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueBefore?: Date;
}

export class DocumentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientId?: number;
}

export class TimeEntryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  invoiced?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}

export class ExpenseQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  invoiced?: boolean;
}

export class InvoiceQueryDto {
  @IsOptional()
  @IsIn(INVOICE_STATUSES)
  status?: (typeof INVOICE_STATUSES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;
}

export class PaymentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  invoiceId?: number;
}

export class TrustQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  reconciled?: boolean;
}

export class CommunicationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  conversationKey?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  unread?: boolean;

  @IsOptional()
  @IsBoolean()
  unreplied?: boolean;

  @IsOptional()
  @IsBoolean()
  needsFollowUp?: boolean;

  @IsOptional()
  @IsBoolean()
  internal?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}

export class NoteQueryDto {
  @IsOptional()
  @IsIn(NOTE_TARGET_TYPES)
  targetType?: (typeof NOTE_TARGET_TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  targetId?: number;
}

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}

export class ReportsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;
}
