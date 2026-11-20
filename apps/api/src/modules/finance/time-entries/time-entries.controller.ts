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
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
} from '../../../common/dto/create-time-entry.dto';
import { TimeEntryQueryDto } from '../../../common/dto/special.dto';
import { TimeEntriesService } from './time-entries.service';

@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly service: TimeEntriesService) {}

  @Get()
  findAll(@Query() query: TimeEntryQueryDto) {
    return this.service.findAll(query ?? {});
  }

  /** 当前计时中的条目（静态路由必须在 :id 之前）。 */
  @Get('timer/running')
  running() {
    return this.service.running();
  }

  @Post('timer/start')
  startTimer(@Body() dto: CreateTimeEntryDto) {
    return this.service.startTimer(dto);
  }

  @Post(':id/timer/stop')
  stopTimer(@Param('id', ParseIntPipe) id: number) {
    return this.service.stopTimer(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTimeEntryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTimeEntryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
