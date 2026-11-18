import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MaxLength(180)
  title: string;

  @IsOptional()
  @IsString()
  content?: string | null;

  @IsEnum(['account', 'contact', 'lead', 'opportunity'])
  targetType: 'account' | 'contact' | 'lead' | 'opportunity';

  @IsInt()
  @IsPositive()
  targetId: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  owner?: string;
}

export class UpdateNoteDto extends PartialType(CreateNoteDto) {}
