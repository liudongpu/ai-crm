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
  CreateInvoiceDto,
  UpdateInvoiceDto,
} from '../../../common/dto/create-invoice.dto';
import { InvoicePaymentDto, InvoiceQueryDto } from '../../../common/dto/special.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get()
  findAll(@Query() query: InvoiceQueryDto) {
    return this.service.findAll(query ?? {});
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInvoiceDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number, @Body() body: { actorId?: number }) {
    return this.service.approve(id, body?.actorId);
  }

  @Post(':id/send')
  send(@Param('id', ParseIntPipe) id: number) {
    return this.service.send(id);
  }

  @Post(':id/void')
  void(@Param('id', ParseIntPipe) id: number) {
    return this.service.void(id);
  }

  @Post(':id/payments')
  addPayment(@Param('id', ParseIntPipe) id: number, @Body() dto: InvoicePaymentDto) {
    return this.service.addPayment(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
