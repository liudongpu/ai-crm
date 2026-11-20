import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { computeDeadlineItems, CourtRuleStep } from '../../../common/calendar-rules.util';
import {
  CompanyCheckDto,
  CompensationDto,
  CreateToolCalculationDto,
  DeadlineToolDto,
  EvidenceCatalogDto,
  InterestDto,
  LitigationFeeDto,
  OcrBatchDto,
  RedactDto,
  ToolCalculationQueryDto,
} from '../../../common/dto/toolbox.dto';
import { CourtHoliday, Matter, ToolCalculation } from '../../../database/entities';
import {
  calcCompensation,
  calcInterest,
  calcLitigationFee,
  COMPENSATION_STATS,
  DEADLINE_PRESETS,
  JURISDICTIONS,
  LPR_HISTORY,
} from './calculators';
import { DEMO_COMPANIES, findDemoCompany } from './company-data';
import { buildEvidenceCatalog, redactText, registerOcrBatch } from './document-tools';

const LOCAL_META = {
  engine: 'local-rules',
  needsHumanReview: true,
  disclaimer:
    '律师工具箱全部结果由本地规则生成，仅供辅助参考，须由承办律师结合案件事实与最新官方标准人工核对；不构成正式法律意见。',
};

@Injectable()
export class LegalToolboxService {
  constructor(
    @InjectRepository(ToolCalculation) private readonly calculations: Repository<ToolCalculation>,
    @InjectRepository(CourtHoliday) private readonly holidays: Repository<CourtHoliday>,
    @InjectRepository(Matter) private readonly matters: Repository<Matter>,
  ) {}

  getMeta() {
    return {
      ...LOCAL_META,
      jurisdictions: JURISDICTIONS,
      lprHistory: LPR_HISTORY,
      compensationStats: COMPENSATION_STATS,
      deadlinePresets: DEADLINE_PRESETS,
      feeCaseTypes: [
        { code: 'property', label: '财产案件' },
        { code: 'divorce', label: '离婚案件' },
        { code: 'labor', label: '劳动争议案件' },
        { code: 'ip', label: '商标/专利/著作权纠纷' },
        { code: 'admin', label: '行政案件' },
        { code: 'other', label: '其他非财产案件' },
      ],
      demoCompanies: DEMO_COMPANIES.map((c) => ({ name: c.name, riskLevel: c.riskLevel })),
    };
  }

  litigationFee(dto: LitigationFeeDto) {
    return { ...LOCAL_META, result: calcLitigationFee(dto) };
  }

  interest(dto: InterestDto) {
    return { ...LOCAL_META, result: calcInterest(dto) };
  }

  compensation(dto: CompensationDto) {
    return { ...LOCAL_META, result: calcCompensation(dto) };
  }

  async deadline(dto: DeadlineToolDto) {
    const preset = DEADLINE_PRESETS[dto.type];
    const days = dto.type === 'custom' ? dto.days : preset?.days;
    if (!days) throw new BadRequestException('自定义期限必须提供天数');

    const label = dto.label?.trim() || preset?.label || '自定义期限';
    const step: CourtRuleStep = {
      code: dto.type,
      label,
      offsetDays: days,
      base: 'trigger',
      businessDays: dto.businessDaysOnly ?? true,
    };
    const holidays = await this.holidays.find();
    const items = computeDeadlineItems({ steps: [step] }, dto.triggerDate, [], holidays);

    return {
      ...LOCAL_META,
      result: {
        type: dto.type,
        label,
        basis: preset?.basis ?? '用户自定义',
        triggerDate: dto.triggerDate,
        days,
        businessDaysOnly: dto.businessDaysOnly ?? true,
        items,
        holidayCount: holidays.length,
        disclaimer: LOCAL_META.disclaimer,
      },
    };
  }

  redact(dto: RedactDto) {
    return { ...LOCAL_META, result: redactText(dto.text, dto.only) };
  }

  evidenceCatalog(dto: EvidenceCatalogDto) {
    return { ...LOCAL_META, result: buildEvidenceCatalog(dto) };
  }

  ocrBatch(dto: OcrBatchDto) {
    return { ...LOCAL_META, result: registerOcrBatch(dto.files) };
  }

  companyCheck(dto: CompanyCheckDto) {
    const company = findDemoCompany(dto.name);
    if (!company) {
      return {
        ...LOCAL_META,
        found: false,
        query: dto.name,
        result: null,
        message: '本地演示主体库中未找到该名称；本工具不连接实时工商/司法数据源。可尝试演示主体列表中的名称。',
      };
    }
    return {
      ...LOCAL_META,
      found: true,
      query: dto.name,
      result: company,
      dataSource: 'local-demo',
      dataSourceLabel: '本地演示数据（非实时）',
      message: '以下为虚构演示数据，不是实时工商/失信查询结果，不得作为尽调或授信依据。',
    };
  }

  async createCalculation(dto: CreateToolCalculationDto) {
    const matter = await this.matters.findOne({ where: { id: dto.matterId } });
    if (!matter) throw new NotFoundException(`案件 ${dto.matterId} 不存在`);
    const entity = this.calculations.create({
      matterId: dto.matterId,
      toolCode: dto.toolCode,
      toolName: dto.toolName,
      title: dto.title,
      input: dto.input,
      result: dto.result,
      summary: dto.summary ?? null,
      createdById: 1,
    });
    return this.calculations.save(entity);
  }

  findCalculations(query: ToolCalculationQueryDto = {}) {
    const where: { matterId?: number; toolCode?: string } = {};
    if (query.matterId) where.matterId = query.matterId;
    if (query.toolCode) where.toolCode = query.toolCode;
    return this.calculations.find({ where, order: { createdAt: 'DESC' } });
  }

  async findCalculation(id: number) {
    const entity = await this.calculations.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`工具计算记录 ${id} 不存在`);
    return entity;
  }

  async removeCalculation(id: number) {
    const entity = await this.findCalculation(id);
    await this.calculations.remove(entity);
    return { id };
  }
}
