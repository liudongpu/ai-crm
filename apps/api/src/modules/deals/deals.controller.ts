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
import { CreateDealDto, MoveDealDto, UpdateDealDto } from '../../common/dto/create-deal.dto';
import { DealsService } from './deals.service';

@Controller('deals')
export class DealsController {
  constructor(private readonly service: DealsService) {}

  @Get()
  findAll(
    @Query('pipelineId') pipelineId?: string,
    @Query('stageId') stageId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({
      pipelineId: pipelineId ? Number(pipelineId) : undefined,
      stageId: stageId ? Number(stageId) : undefined,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDealDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDealDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/stage')
  move(@Param('id', ParseIntPipe) id: number, @Body() dto: MoveDealDto) {
    return this.service.move(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
