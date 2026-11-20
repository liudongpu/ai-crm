import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  Max,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export type FeeCaseType = 'property' | 'divorce' | 'labor' | 'ip' | 'admin' | 'other';
export const FEE_CASE_TYPES: FeeCaseType[] = ['property', 'divorce', 'labor', 'ip', 'admin', 'other'];

export class LitigationFeeDto {
  @IsIn(FEE_CASE_TYPES)
  caseType: FeeCaseType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsIn(['national', 'beijing', 'shanghai', 'guangdong', 'jiangsu', 'zhejiang'])
  jurisdiction?: string;

  @IsOptional()
  @IsIn(['none', 'half'])
  reduction?: 'none' | 'half';
}

export class InterestSegmentDto {
  @IsString()
  from: string;

  @Type(() => Number)
  @IsNumber()
  rate: number;
}

export class InterestDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  principal: number;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsIn(['single', 'yearly', 'monthly'])
  compound?: 'single' | 'yearly' | 'monthly';

  @IsOptional()
  @IsIn(['1y', '5y', 'manual'])
  rateSource?: '1y' | '5y' | 'manual';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  manualRate?: number;

  @IsOptional()
  @IsArray()
  @Type(() => InterestSegmentDto)
  segments?: InterestSegmentDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsBoolean()
  doubleDelay?: boolean;

  @IsOptional()
  @IsString()
  delayStartDate?: string;
}

export class CompensationDto {
  @IsIn(['personal', 'work_injury', 'work_death', 'economic'])
  type: 'personal' | 'work_injury' | 'work_death' | 'economic';

  @IsOptional()
  @IsIn(['national', 'beijing', 'shanghai', 'guangdong', 'jiangsu', 'zhejiang'])
  region?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  medicalCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lostWageMonths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyWage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  careMonths?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  disabilityGrade?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  otherCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  yearsWorked?: number;

  @IsOptional()
  @IsIn(['N', 'N1', '2N'])
  compensationMode?: 'N' | 'N1' | '2N';

  @IsOptional()
  @IsBoolean()
  applyTripleCap?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  localAverageWage?: number;
}

export class DeadlineToolDto {
  @IsIn(['appeal', 'evidence', 'execution', 'answer', 'custom'])
  type: 'appeal' | 'evidence' | 'execution' | 'answer' | 'custom';

  @IsString()
  triggerDate: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  businessDaysOnly?: boolean;
}

export class CompanyCheckDto {
  @IsString()
  name: string;
}

export class RedactDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsIn(['idCard', 'bankCard', 'phone', 'email'])
  only?: 'idCard' | 'bankCard' | 'phone' | 'email';
}

export class EvidenceItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pages?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class EvidenceCatalogDto {
  @IsString()
  caseName: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @IsString()
  submitter?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceItemDto)
  items: EvidenceItemDto[];
}

export class OcrFileDto {
  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  size?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pages?: number;
}

export class OcrBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OcrFileDto)
  files: OcrFileDto[];
}

export class CreateToolCalculationDto {
  @IsInt()
  matterId: number;

  @IsString()
  toolCode: string;

  @IsString()
  toolName: string;

  @IsString()
  title: string;

  @IsObject()
  input: Record<string, unknown>;

  @IsObject()
  result: Record<string, unknown>;

  @IsOptional()
  @IsString()
  summary?: string;
}

export class ToolCalculationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  matterId?: number;

  @IsOptional()
  @IsString()
  toolCode?: string;
}
