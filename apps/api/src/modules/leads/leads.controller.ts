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
import { CreateLeadDto, UpdateLeadDto } from '../../common/dto/create-lead.dto';
import { ConvertLeadDto } from '../../common/dto/special.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto);
  }

  @Post(':id/convert')
  convert(@Param('id', ParseIntPipe) id: number, @Body() dto: ConvertLeadDto) {
    return this.service.convert(id, dto ?? {});
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
