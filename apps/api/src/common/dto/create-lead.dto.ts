import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(180)
  company: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string | null;

  @IsOptional()
  @IsEnum(['new', 'working', 'qualified', 'converted', 'unqualified'])
  status?: 'new' | 'working' | 'qualified' | 'converted' | 'unqualified';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string | null;

  @IsOptional()
  @IsEnum(['hot', 'warm', 'cold'])
  rating?: 'hot' | 'warm' | 'cold';

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  owner?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  convertedContactId?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  convertedDealId?: number | null;
}

export class UpdateLeadDto extends PartialType(CreateLeadDto) {}
