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
  CreateCommunicationDto,
  UpdateCommunicationDto,
} from '../../common/dto/create-communication.dto';
import { CommunicationQueryDto } from '../../common/dto/special.dto';
import { CommunicationsService } from './communications.service';

@Controller('communications')
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}

  @Get()
  findAll(@Query() query: CommunicationQueryDto) {
    return this.service.findAll(query ?? {});
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCommunicationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCommunicationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
