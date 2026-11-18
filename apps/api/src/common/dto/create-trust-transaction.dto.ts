import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  TRUST_CATEGORIES,
  TRUST_TYPES,
  TrustCategory,
  TrustType,
} from '../../database/entities';

export class CreateTrustTransactionDto {
  @IsInt()
  clientId: number;

  @IsOptional()
  @IsInt()
  matterId?: number;

  @IsIn(TRUST_TYPES)
  type: TrustType;

  @IsIn(TRUST_CATEGORIES)
  category: TrustCategory;

  @IsNumber()
  @Min(0)
  amount: number;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsBoolean()
  reconciled?: boolean;
}

export class UpdateTrustTransactionDto extends PartialType(CreateTrustTransactionDto) {}
