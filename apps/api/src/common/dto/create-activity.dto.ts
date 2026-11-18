import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateActivityDto {
  @IsEnum(['call', 'email', 'meeting', 'task', 'deadline'])
  type: 'call' | 'email' | 'meeting' | 'task' | 'deadline';

  @IsString()
  @MaxLength(180)
  subject: string;

  @IsOptional()
  @IsString()
  dueDate?: string | null;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  dealId?: number | null;

  @IsOptional()
  @IsInt()
  contactId?: number | null;
}

export class UpdateActivityDto extends PartialType(CreateActivityDto) {}
