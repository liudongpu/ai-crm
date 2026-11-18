import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LEAD_RATINGS, LEAD_STATUSES, LeadRating, LeadStatus } from '../../database/entities';

export class CreateLeadDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  practiceArea?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: LeadStatus;

  @IsOptional()
  @IsIn(LEAD_RATINGS)
  rating?: LeadRating;

  @IsOptional()
  @IsBoolean()
  conflictChecked?: boolean;

  @IsOptional()
  @IsIn(['clear', 'conflict'])
  conflictResult?: 'clear' | 'conflict';

  @IsOptional()
  @IsInt()
  ownerId?: number;
}

export class UpdateLeadDto extends PartialType(CreateLeadDto) {}
