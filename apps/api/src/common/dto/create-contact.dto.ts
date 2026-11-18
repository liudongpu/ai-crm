import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateContactDto extends PartialType(CreateContactDto) {}
