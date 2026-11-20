import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class MatterCategoryStageDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsString()
  @MaxLength(20)
  color: string;

  @IsInt()
  @Min(0)
  @Max(100)
  probability: number;

  @IsOptional()
  @IsBoolean()
  isFinal?: boolean;
}

export class CreateMatterCategoryDto {
  @IsString()
  @MaxLength(60)
  name: string;

  @IsString()
  @MaxLength(60)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatterCategoryStageDto)
  stages: MatterCategoryStageDto[];
}

export class UpdateMatterCategoryDto extends PartialType(CreateMatterCategoryDto) {}
