import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
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
import { LegalToolboxService } from './legal-toolbox.service';

/**
 * 律师工具箱端点。计算规则本地实现，OCR 与企业速查为明确标注的本地演示数据。
 * 计算结果可通过 /legal-toolbox/calculations 结构化保存到当前案件。
 */
@Controller('legal-toolbox')
export class LegalToolboxController {
  constructor(private readonly service: LegalToolboxService) {}

  @Get('meta')
  meta() {
    return this.service.getMeta();
  }

  @Post('litigation-fee')
  litigationFee(@Body() dto: LitigationFeeDto) {
    return this.service.litigationFee(dto);
  }

  @Post('interest')
  interest(@Body() dto: InterestDto) {
    return this.service.interest(dto);
  }

  @Post('compensation')
  compensation(@Body() dto: CompensationDto) {
    return this.service.compensation(dto);
  }

  @Post('deadline')
  deadline(@Body() dto: DeadlineToolDto) {
    return this.service.deadline(dto);
  }

  @Post('redact')
  redact(@Body() dto: RedactDto) {
    return this.service.redact(dto);
  }

  @Post('evidence-catalog')
  evidenceCatalog(@Body() dto: EvidenceCatalogDto) {
    return this.service.evidenceCatalog(dto);
  }

  @Post('ocr-batch')
  ocrBatch(@Body() dto: OcrBatchDto) {
    return this.service.ocrBatch(dto);
  }

  @Post('company-check')
  companyCheck(@Body() dto: CompanyCheckDto) {
    return this.service.companyCheck(dto);
  }

  @Get('calculations')
  calculations(@Query() query: ToolCalculationQueryDto) {
    return this.service.findCalculations(query);
  }

  @Get('calculations/:id')
  calculation(@Param('id', ParseIntPipe) id: number) {
    return this.service.findCalculation(id);
  }

  @Post('calculations')
  saveCalculation(@Body() dto: CreateToolCalculationDto) {
    return this.service.createCalculation(dto);
  }

  @Delete('calculations/:id')
  removeCalculation(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeCalculation(id);
  }
}
