import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsInt()
  companyId?: number | null;
}

export class UpdateContactDto extends PartialType(CreateContactDto) {}
