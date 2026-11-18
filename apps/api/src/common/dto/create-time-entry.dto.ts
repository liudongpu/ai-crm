import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTimeEntryDto {
  @IsInt()
  matterId: number;

  @IsInt()
  userId: number;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsNumber()
  @Min(0)
  hours: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsBoolean()
  invoiced?: boolean;

  @IsOptional()
  @IsInt()
  invoiceId?: number;
}

export class UpdateTimeEntryDto extends PartialType(CreateTimeEntryDto) {}
