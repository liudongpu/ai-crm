import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import {
  MATTER_PRIORITIES,
  MATTER_STATUSES,
  MatterPriority,
  MatterStatus,
} from '../../database/entities';

export class CreateMatterDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  caseNumber?: string;

  @IsInt()
  clientId: number;

  @IsInt()
  stageId: number;

  @IsString()
  practiceArea: string;

  @IsOptional()
  @IsIn(MATTER_STATUSES)
  status?: MatterStatus;

  @IsOptional()
  @IsIn(MATTER_PRIORITIES)
  priority?: MatterPriority;

  @IsOptional()
  @IsInt()
  ownerId?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  openDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  closeDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsInt()
  position?: number;
}

export class UpdateMatterDto extends PartialType(CreateMatterDto) {}
