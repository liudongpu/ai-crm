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

export class CreateExpenseDto {
  @IsInt()
  matterId: number;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsString()
  category: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @IsOptional()
  @IsBoolean()
  invoiced?: boolean;

  @IsOptional()
  @IsInt()
  invoiceId?: number;

  @IsOptional()
  @IsString()
  receipt?: string;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
