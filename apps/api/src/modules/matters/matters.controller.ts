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
import { CreateMatterDto, UpdateMatterDto } from '../../common/dto/create-matter.dto';
import {
  MatterQueryDto,
  UpdateMatterStageDto,
} from '../../common/dto/special.dto';
import { MattersService } from './matters.service';

@Controller('matters')
export class MattersController {
  constructor(private readonly service: MattersService) {}

  @Get('stages')
  listStages() {
    return this.service.listStages();
  }

  @Get()
  findAll(@Query() query: MatterQueryDto) {
    return this.service.findAll(query ?? {});
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMatterDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMatterDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/stage')
  setStage(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMatterStageDto) {
    return this.service.setStage(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
