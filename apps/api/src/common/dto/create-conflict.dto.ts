import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import {
  CONFLICT_RESULTS,
  CONFLICT_TYPES,
  ConflictResult,
  ConflictType,
} from '../../database/entities';

export class CreateConflictCheckDto {
  @IsString()
  name: string;

  @IsIn(CONFLICT_TYPES)
  type: ConflictType;

  @IsIn(CONFLICT_RESULTS)
  result: ConflictResult;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsInt()
  checkedById?: number;

  @IsOptional()
  @IsInt()
  matterId?: number;
}

export class UpdateConflictCheckDto extends PartialType(CreateConflictCheckDto) {}
