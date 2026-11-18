import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PAYMENT_METHODS, PaymentMethod } from '../../database/entities';

export class CreatePaymentDto {
  @IsInt()
  invoiceId: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @IsIn(PAYMENT_METHODS)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}
