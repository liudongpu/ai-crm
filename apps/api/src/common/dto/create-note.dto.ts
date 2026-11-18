import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { NOTE_TARGET_TYPES, NoteTargetType } from '../../database/entities';

export class CreateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  content: string;

  @IsIn(NOTE_TARGET_TYPES)
  targetType: NoteTargetType;

  @IsInt()
  targetId: number;

  @IsOptional()
  @IsInt()
  authorId?: number;
}

export class UpdateNoteDto extends PartialType(CreateNoteDto) {}
