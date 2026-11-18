import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DOCUMENT_CATEGORIES, DocumentCategory } from '../../database/entities';

export class CreateDocumentDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsIn(DOCUMENT_CATEGORIES)
  category: DocumentCategory;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsInt()
  matterId?: number;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsInt()
  uploadedById?: number;

  @IsOptional()
  @IsBoolean()
  signed?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}
