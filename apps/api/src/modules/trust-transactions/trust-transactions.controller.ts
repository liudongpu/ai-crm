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
  CreateTrustTransactionDto,
  UpdateTrustTransactionDto,
} from '../../common/dto/create-trust-transaction.dto';
import { TrustQueryDto } from '../../common/dto/special.dto';
import { TrustTransactionsService } from './trust-transactions.service';

@Controller('trust-transactions')
export class TrustTransactionsController {
  constructor(private readonly service: TrustTransactionsService) {}

  @Get()
  findAll(@Query() query: TrustQueryDto) {
    return this.service.findAll(query ?? {});
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTrustTransactionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTrustTransactionDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/reconcile')
  reconcile(@Param('id', ParseIntPipe) id: number) {
    return this.service.reconcile(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
