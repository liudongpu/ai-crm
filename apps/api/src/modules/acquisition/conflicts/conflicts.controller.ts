import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreateConflictCheckDto,
  UpdateConflictCheckDto,
} from '../../../common/dto/create-conflict.dto';
import { CheckConflictDto } from '../../../common/dto/special.dto';
import { ConflictsService } from './conflicts.service';

@Controller('conflicts')
export class ConflictsController {
  constructor(private readonly service: ConflictsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post('check')
  check(@Body() dto: CheckConflictDto) {
    return this.service.check(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateConflictCheckDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateConflictCheckDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
