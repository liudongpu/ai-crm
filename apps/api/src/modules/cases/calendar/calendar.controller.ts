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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  CalculateDeadlineDto,
  CalendarEventQueryDto,
  CalendarOverviewQueryDto,
  CreateCalendarEventDto,
  CreateHolidayDto,
  CreateReminderDto,
  CreateRuleDto,
  CreateStatuteDto,
  CreateTimeLinkDto,
  DeadlineQueryDto,
  DraftQueryDto,
  ExtractDatesDto,
  IcsQueryDto,
  ImportIcsDto,
  ReminderQueryDto,
  StatuteQueryDto,
  TimeLinkQueryDto,
  UpdateCalendarEventDto,
  UpdateDeadlineStatusDto,
  UpdateDraftDto,
  UpdateReminderDto,
  UpdateTriggerDto,
  UpdateStatuteDto,
} from '../../../common/dto/calendar.dto';
import { CalendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly service: CalendarService) {}

  // 日历事件（静态路径优先）
  @Get('events')
  findEvents(@Query() query: CalendarEventQueryDto) {
    return this.service.findEvents(query);
  }

  @Post('events')
  createEvent(@Body() dto: CreateCalendarEventDto) {
    return this.service.createEvent(dto);
  }

  @Delete('events/:id')
  removeEvent(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeEvent(id);
  }

  @Patch('events/:id')
  updateEvent(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCalendarEventDto) {
    return this.service.updateEvent(id, dto);
  }

  @Get('overview')
  overview(@Query() query: CalendarOverviewQueryDto) {
    return this.service.overview(query);
  }

  // 规则与节假日
  @Get('rules')
  findRules() {
    return this.service.findRules();
  }

  @Post('rules')
  createRule(@Body() dto: CreateRuleDto) {
    return this.service.createRule(dto);
  }

  @Get('holidays')
  findHolidays() {
    return this.service.findHolidays();
  }

  @Post('holidays')
  createHoliday(@Body() dto: CreateHolidayDto) {
    return this.service.createHoliday(dto);
  }

  @Delete('holidays/:id')
  removeHoliday(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeHoliday(id);
  }

  // 期限计算
  @Post('deadlines/calculate')
  calculateDeadline(@Body() dto: CalculateDeadlineDto) {
    return this.service.calculateDeadline(dto);
  }

  @Get('deadlines')
  findDeadlines(@Query() query: DeadlineQueryDto) {
    return this.service.findDeadlines(query);
  }

  @Get('deadlines/:id')
  getDeadline(@Param('id', ParseIntPipe) id: number) {
    return this.service.getDeadline(id);
  }

  @Patch('deadlines/:id/trigger')
  recalculateDeadline(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTriggerDto) {
    return this.service.recalculateDeadline(id, dto);
  }

  @Patch('deadlines/:id/status')
  updateDeadlineStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeadlineStatusDto,
  ) {
    return this.service.updateDeadlineStatus(id, dto);
  }

  @Delete('deadlines/:id')
  removeDeadline(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeDeadline(id);
  }

  @Post('deadlines/:id/to-events')
  deadlineToEvents(@Param('id', ParseIntPipe) id: number) {
    return this.service.deadlineToEvents(id);
  }

  // 时效
  @Get('statutes')
  findStatutes(@Query() query: StatuteQueryDto) {
    return this.service.findStatutes(query);
  }

  @Post('statutes')
  createStatute(@Body() dto: CreateStatuteDto) {
    return this.service.createStatute(dto);
  }

  @Patch('statutes/:id')
  updateStatute(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatuteDto) {
    return this.service.updateStatute(id, dto);
  }

  @Delete('statutes/:id')
  removeStatute(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeStatute(id);
  }

  // 文本日期识别
  @Post('assistant/extract')
  extractDates(@Body() dto: ExtractDatesDto) {
    return this.service.extractDates(dto);
  }

  @Get('assistant/drafts')
  findDrafts(@Query() query: DraftQueryDto) {
    return this.service.findDrafts(query);
  }

  @Patch('assistant/drafts/:id')
  updateDraft(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDraftDto) {
    return this.service.updateDraft(id, dto);
  }

  @Delete('assistant/drafts/:id')
  removeDraft(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeDraft(id);
  }

  // ICS
  @Get('feed.ics')
  async exportIcs(@Query() query: IcsQueryDto, @Res() res: Response) {
    const ics = await this.service.exportIcs(query);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="lexdesk-calendar.ics"');
    res.send(ics);
  }

  @Post('import')
  importIcs(@Body() dto: ImportIcsDto) {
    return this.service.importIcs(dto);
  }

  // 提醒
  @Get('reminders')
  findReminders(@Query() query: ReminderQueryDto) {
    return this.service.findReminders(query);
  }

  @Post('reminders')
  createReminder(@Body() dto: CreateReminderDto) {
    return this.service.createReminder(dto);
  }

  @Patch('reminders/:id')
  updateReminder(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReminderDto) {
    return this.service.updateReminder(id, dto);
  }

  @Delete('reminders/:id')
  removeReminder(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeReminder(id);
  }

  // 日程与工时联动
  @Get('time-link/unlogged')
  unloggedEvents(@Query() query: TimeLinkQueryDto) {
    return this.service.unloggedEvents(query);
  }

  @Get('time-link/logged')
  loggedEntries() {
    return this.service.loggedEntries();
  }

  @Post('time-link')
  logTime(@Body() dto: CreateTimeLinkDto) {
    return this.service.logTime(dto);
  }
}
