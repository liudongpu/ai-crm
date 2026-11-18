import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsDate, IsObject, IsOptional, IsString } from 'class-validator';

export class WorkspaceItemQueryDto {
  @IsOptional()
  @IsString()
  featureCode?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class WorkspaceStatsQueryDto {
  @IsOptional()
  @IsString()
  featureCode?: string;
}

export class WorkspaceSettingQueryDto {
  @IsOptional()
  @IsString()
  featureCode?: string;
}

export class CreateWorkspaceItemDto {
  @IsString()
  featureCode: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;
}

export class UpdateWorkspaceItemDto extends PartialType(CreateWorkspaceItemDto) {}

export class UpdateWorkspaceSettingDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}
