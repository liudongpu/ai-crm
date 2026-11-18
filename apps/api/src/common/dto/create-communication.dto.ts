import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
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

  @IsOptional()
  @IsString()
  conversationKey?: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsBoolean()
  unread?: boolean;

  @IsOptional()
  @IsBoolean()
  replied?: boolean;

  @IsOptional()
  @IsBoolean()
  needsFollowUp?: boolean;

  @IsOptional()
  @IsBoolean()
  internal?: boolean;

  @IsOptional()
  @IsBoolean()
  aiDraft?: boolean;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  @IsOptional()
  @IsInt()
  templateId?: number;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  attachments?: Array<{ name: string; kind: string; refId?: number }>;
}

export class UpdateCommunicationDto extends PartialType(CreateCommunicationDto) {}
