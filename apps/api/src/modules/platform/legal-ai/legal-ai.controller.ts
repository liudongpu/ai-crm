import { Body, Controller, Post } from '@nestjs/common';
import {
  AdminAssistantDto,
  CaseAnalysisDto,
  ContractReviewDto,
  DraftDto,
  InsightDto,
  LegalResearchDto,
} from '../../../common/dto/legal-ai.dto';
import { LegalAiService } from './legal-ai.service';

/**
 * 法律 AI 辅助端点。全部为本地规则 + 真实业务数据生成，
 * 输出均为需人工核对的草稿；不调用外部模型、不自动发送/提交。
 */
@Controller('legal-ai')
export class LegalAiController {
  constructor(private readonly service: LegalAiService) {}

  /** 案情与卷宗智能解析：时间线、当事人关系、争议焦点、初筛摘要。 */
  @Post('case-analysis')
  analyzeCase(@Body() dto: CaseAnalysisDto) {
    return this.service.analyzeCase(dto);
  }

  /** 智能文书起草与审查：本所模板 + 案件事实 + 历史范本，生成初稿。 */
  @Post('draft')
  draft(@Body() dto: DraftDto) {
    return this.service.draftDocument(dto);
  }

  /** 合同智能风控审查：我方立场下风险条款、缺失条款、一键替换建议。 */
  @Post('contract-review')
  reviewContract(@Body() dto: ContractReviewDto) {
    return this.service.reviewContract(dto);
  }

  /** 法规与类案检索：结论强制附法条原文与有效状态校验。 */
  @Post('research')
  research(@Body() dto: LegalResearchDto) {
    return this.service.research(dto);
  }

  /** 行政事务 AI 助手：办案日志→客户周报 + 到期日识别与提醒建议。 */
  @Post('admin-assistant')
  adminAssistant(@Body() dto: AdminAssistantDto) {
    return this.service.adminAssistant(dto);
  }

  /** AI 洞察：经营趋势对比、待办智能排序、风险提示与客户活跃度（本地规则 + 真实业务数据）。 */
  @Post('insights')
  insights(@Body() dto: InsightDto) {
    return this.service.insights(dto);
  }
}
