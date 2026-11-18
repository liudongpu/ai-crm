import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { CLIENT_STATUSES, CLIENT_TYPES, ClientStatus, ClientType } from '../../database/entities';

export class CreateClientDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsIn(CLIENT_TYPES)
  type?: ClientType;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsIn(CLIENT_STATUSES)
  status?: ClientStatus;

  @IsOptional()
  @IsInt()
  ownerId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {}
