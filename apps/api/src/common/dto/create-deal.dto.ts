import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDealDto {
  @IsString()
  @MaxLength(180)
  title: string;

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsEnum(['open', 'won', 'lost'])
  status?: 'open' | 'won' | 'lost';

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  expectedCloseDate?: string | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  stageId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  pipelineId?: number;

  @IsOptional()
  @IsInt()
  contactId?: number | null;

  @IsOptional()
  @IsInt()
  companyId?: number | null;
}

export class UpdateDealDto extends PartialType(CreateDealDto) {}

export class MoveDealDto {
  @IsInt()
  @IsPositive()
  stageId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
