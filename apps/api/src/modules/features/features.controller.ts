import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateFeatureRecordDto,
  FeatureQueryDto,
  FeatureRecordQueryDto,
  FeatureStatsQueryDto,
  UpdateFeatureRecordDto,
} from '../../common/dto/feature.dto';
import { FeaturesService } from './features.service';

@Controller('features')
export class FeaturesController {
  constructor(private readonly service: FeaturesService) {}

  @Get('catalog')
  catalog() {
    return this.service.catalog();
  }

  @Get('records')
  findRecords(@Query() query: FeatureRecordQueryDto) {
    return this.service.findRecords(query ?? {});
  }

  @Get('records/:id')
  findRecord(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRecord(id);
  }

  @Post('records')
  createRecord(@Body() dto: CreateFeatureRecordDto) {
    return this.service.createRecord(dto);
  }

  @Patch('records/:id')
  updateRecord(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFeatureRecordDto) {
    return this.service.updateRecord(id, dto);
  }

  @Delete('records/:id')
  removeRecord(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeRecord(id);
  }

  @Get('stats')
  stats(@Query() query: FeatureStatsQueryDto) {
    return this.service.stats(query ?? {});
  }

  @Get()
  findAll(@Query() query: FeatureQueryDto) {
    return this.service.findAll(query ?? {});
  }
}
