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
import { MessageTemplate } from '../../database/entities';
import { CommunicationsService } from './communications.service';

@Controller('communications')
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}

  @Get()
  findAll(@Query() query: CommunicationQueryDto) {
    return this.service.findAll(query ?? {});
  }

  /** M7 会话聚合（左侧会话列表）。注意：静态路由必须在 :id 之前。 */
  @Get('inbox')
  inbox() {
    return this.service.inbox();
  }

  @Get('templates')
  templates() {
    return this.service.templates();
  }

  @Post('templates')
  createTemplate(@Body() data: Partial<MessageTemplate>) {
    return this.service.createTemplate(data);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<MessageTemplate>) {
    return this.service.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  removeTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeTemplate(id);
  }

  /** 本地 AI 起草（需人工确认后发送）。 */
  @Get('ai-draft')
  aiDraft(@Query('matterId') matterId?: string, @Query('intent') intent?: string) {
    return this.service.aiDraft(matterId ? Number(matterId) : undefined, intent);
  }

  /** 将整个会话归档到案件（静态路由必须在 :id 之前）。 */
  @Post('archive-conversation')
  archiveConversation(@Body() body: { conversationKey: string; matterId: number; clientId?: number }) {
    return this.service.archiveConversation(body.conversationKey, body.matterId, body.clientId);
  }

  @Post(':id/archive')
  archive(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { matterId: number; clientId?: number },
  ) {
    return this.service.archive(id, body.matterId, body.clientId);
  }

  @Post(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number) {
    return this.service.markRead(id);
  }

  @Post(':id/replied')
  markReplied(@Param('id', ParseIntPipe) id: number) {
    return this.service.markReplied(id);
  }

  @Post(':id/follow-up')
  toggleFollowUp(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleFollowUp(id);
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
