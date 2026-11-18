import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { USER_ROLES, UserRole } from '../../database/entities';

export class CreateUserDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsEmail()
  email: string;

  @IsIn(USER_ROLES)
  role: UserRole;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
