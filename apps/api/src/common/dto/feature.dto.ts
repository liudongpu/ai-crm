import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  FEATURE_RECORD_PRIORITIES,
  FEATURE_RECORD_STATUSES,
  FeatureRecordPriority,
  FeatureRecordStatus,
} from '../../database/entities';

export class FeatureQueryDto {
  @IsOptional()
  @IsString()
  moduleCode?: string;
}

export class FeatureRecordQueryDto {
  @IsOptional()
  @IsString()
  featureCode?: string;

  @IsOptional()
  @IsIn(FEATURE_RECORD_STATUSES)
  status?: FeatureRecordStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

export class FeatureStatsQueryDto {
  @IsOptional()
  @IsString()
  featureCode?: string;
}

export class CreateFeatureRecordDto {
  @IsString()
  featureCode: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(FEATURE_RECORD_STATUSES)
  status?: FeatureRecordStatus;

  @IsOptional()
  @IsIn(FEATURE_RECORD_PRIORITIES)
  priority?: FeatureRecordPriority;

  @IsOptional()
  @IsInt()
  ownerId?: number;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsInt()
  matterId?: number;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class UpdateFeatureRecordDto extends PartialType(CreateFeatureRecordDto) {}
