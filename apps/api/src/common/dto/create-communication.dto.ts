import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import {
  COMMUNICATION_DIRECTIONS,
  COMMUNICATION_TYPES,
  CommunicationDirection,
  CommunicationType,
} from '../../database/entities';

export class CreateCommunicationDto {
  @IsOptional()
  @IsInt()
  matterId?: number;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsInt()
  contactId?: number;

  @IsIn(COMMUNICATION_TYPES)
  type: CommunicationType;

  @IsIn(COMMUNICATION_DIRECTIONS)
  direction: CommunicationDirection;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  content: string;

  @Type(() => Date)
  @IsDate()
  occurredAt: Date;

  @IsOptional()
  @IsInt()
  userId?: number;
}

export class UpdateCommunicationDto extends PartialType(CreateCommunicationDto) {}
