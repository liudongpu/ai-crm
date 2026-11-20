import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsIn, Min, Max } from 'class-validator';

export type DraftDocType = 'complaint' | 'letter' | 'answer' | 'opinion';
export type ContractStance = 'buyer' | 'seller' | 'neutral';
export type ContractToughness = 'standard' | 'strong';

/** 所有 AI 请求都可带操作者 id，用于校验「使用法律 AI 辅助」权限。 */
export class LegalAiRequestDto {
  @IsOptional()
  @IsInt()
  actorId?: number;
}

export class CaseAnalysisDto extends LegalAiRequestDto {
  @IsInt()
  matterId: number;

  @IsOptional()
  @IsString()
  text?: string;
}

export class DraftDto extends LegalAiRequestDto {
  @IsInt()
  matterId: number;

  @IsIn(['complaint', 'letter', 'answer', 'opinion'])
  docType: DraftDocType;

  @IsOptional()
  @IsString()
  stance?: string;
}

export class ContractReviewDto extends LegalAiRequestDto {
  @IsOptional()
  @IsInt()
  documentId?: number;

  @IsOptional()
  @IsString()
  text?: string;

  @IsIn(['buyer', 'seller', 'neutral'])
  stance: ContractStance;

  @IsIn(['standard', 'strong'])
  toughness: ContractToughness;
}

export class LegalResearchDto extends LegalAiRequestDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsInt()
  matterId?: number;
}

export class AdminAssistantDto extends LegalAiRequestDto {
  @IsOptional()
  @IsInt()
  matterId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  periodDays?: number;
}

/** AI 洞察：按统计周期汇总经营趋势、待办优先级与风险提示。 */
export class InsightDto extends LegalAiRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(365)
  periodDays?: number;

  @IsOptional()
  @IsInt()
  matterId?: number;
}
