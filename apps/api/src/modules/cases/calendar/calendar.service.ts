import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository, SelectQueryBuilder } from 'typeorm';
import {
  addDays,
  computeDeadlineItems,
  DeadlineRuleLike,
  toDate,
} from '../../../common/calendar-rules.util';
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
  UpdateStatuteDto,
  UpdateTriggerDto,
} from '../../../common/dto/calendar.dto';
import {
  CalendarDraftEvent,
  CalendarReminder,
  CourtHoliday,
  CourtRule,
  DeadlineCalculation,
  DeadlineStatus,
  Document,
  Matter,
  ReminderChannel,
  Statute,
  StatuteStatus,
  Task,
  TaskType,
  TimeEntry,
  User,
} from '../../../database/entities';

type StatuteWithDaysLeft = Statute & { daysLeft: number };

const KEYWORD_MATCHERS: Array<{ words: string[]; type: TaskType }> = [
  { words: ['开庭', '庭审'], type: 'hearing' },
  { words: ['举证', '提交', '截止', '期限', '上诉', '保全', '答辩'], type: 'deadline' },
  { words: ['会议', '会谈'], type: 'task' },
];

function taskTypeForKeyword(keyword: string): TaskType {
  for (const matcher of KEYWORD_MATCHERS) {
    if (matcher.words.includes(keyword)) return matcher.type;
  }
  return 'task';
}

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(TimeEntry) private readonly entries: Repository<TimeEntry>,
    @InjectRepository(Document) private readonly documents: Repository<Document>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Matter) private readonly matters: Repository<Matter>,
    @InjectRepository(CourtRule) private readonly rules: Repository<CourtRule>,
    @InjectRepository(CourtHoliday) private readonly holidays: Repository<CourtHoliday>,
    @InjectRepository(DeadlineCalculation)
    private readonly calculations: Repository<DeadlineCalculation>,
    @InjectRepository(Statute) private readonly statutes: Repository<Statute>,
    @InjectRepository(CalendarDraftEvent) private readonly drafts: Repository<CalendarDraftEvent>,
    @InjectRepository(CalendarReminder) private readonly reminders: Repository<CalendarReminder>,
  ) {}

  // ---------------- 日历事件 ----------------

  private eventQuery(): SelectQueryBuilder<Task> {
    return this.tasks
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.matter', 'matter')
      .leftJoinAndSelect('task.assignee', 'assignee');
  }

  private applyEventFilters(
    qb: SelectQueryBuilder<Task>,
    query: CalendarEventQueryDto | (IcsQueryDto & TimeLinkQueryDto),
  ): SelectQueryBuilder<Task> {
    if (query.from) {
      qb.andWhere('COALESCE(task.startDate, task.dueDate) >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('COALESCE(task.startDate, task.dueDate) <= :to', { to: query.to });
    }
    if ('calendarId' in query && query.calendarId) {
      qb.andWhere('task.calendarId = :calendarId', { calendarId: query.calendarId });
    }
    if ('matterId' in query && query.matterId !== undefined) {
      qb.andWhere('task.matterId = :matterId', { matterId: query.matterId });
    }
    if ('type' in query && query.type) {
      qb.andWhere('task.type = :type', { type: query.type });
    }
    if ('search' in query && query.search) {
      qb.andWhere('(task.title LIKE :search OR task.description LIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if ('userId' in query && query.userId !== undefined) {
      qb.andWhere('task.assigneeId = :userId', { userId: query.userId });
    }
    return qb;
  }

  async findEvents(query: CalendarEventQueryDto = {}): Promise<Task[]> {
    const qb = this.applyEventFilters(this.eventQuery(), query);
    return qb
      .orderBy('COALESCE(task.startDate, task.dueDate)', 'ASC')
      .addOrderBy('task.id', 'ASC')
      .getMany();
  }

  createEvent(dto: CreateCalendarEventDto): Promise<Task> {
    return this.tasks.save(this.tasks.create(dto));
  }

  async updateEvent(id: number, dto: UpdateCalendarEventDto): Promise<Task> {
    const task = await this.findTask(id);
    Object.assign(task, dto);
    return this.tasks.save(task);
  }

  async removeEvent(id: number): Promise<{ id: number }> {
    const task = await this.findTask(id);
    await this.tasks.remove(task);
    return { id };
  }

  private async findTask(id: number): Promise<Task> {
    const task = await this.tasks.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`日程 ${id} 不存在`);
    return task;
  }

  async overview(query: CalendarOverviewQueryDto = {}) {
    const qb = this.applyEventFilters(this.eventQuery(), query);
    const tasks = await qb.getMany();
    const total = tasks.length;

    const counts = new Map<string, number>();
    const types = new Map<string, number>();
    const matterIds = new Set<number>();
    for (const task of tasks) {
      const calendarId = task.calendarId || 'firm';
      counts.set(calendarId, (counts.get(calendarId) ?? 0) + 1);
      types.set(task.type, (types.get(task.type) ?? 0) + 1);
      if (calendarId.startsWith('matter:')) {
        const id = Number(calendarId.slice('matter:'.length));
        if (Number.isInteger(id)) matterIds.add(id);
      }
    }

    const calendarNames: Record<string, string> = {
      firm: '律所日历',
      team: '团队日历',
      personal: '个人日历',
    };
    if (matterIds.size) {
      const matters = await this.matters.find({ where: { id: In([...matterIds]) } });
      for (const matter of matters) calendarNames[`matter:${matter.id}`] = matter.title;
    }

    const calendars = [...counts.entries()].map(([id, eventCount]) => ({
      id,
      name: calendarNames[id] ?? (id.startsWith('matter:') ? `案件 ${id.slice(7)}` : id),
      eventCount,
    }));
    const byType = [...types.entries()].map(([type, count]) => ({ type, count }));

    const unloggedQb = this.tasks
      .createQueryBuilder('task')
      .leftJoin('time_entries', 'entry', 'entry.sourceTaskId = task.id')
      .where('task.dueDate IS NOT NULL')
      .andWhere('entry.id IS NULL');
    if (query.from) unloggedQb.andWhere('task.dueDate >= :from', { from: query.from });
    if (query.to) unloggedQb.andWhere('task.dueDate <= :to', { to: query.to });
    const unloggedCount = await unloggedQb.getCount();

    return { total, calendars, byType, unloggedCount };
  }

  // ---------------- 规则与节假日 ----------------

  findRules(): Promise<CourtRule[]> {
    return this.rules.find({ order: { position: 'ASC', id: 'ASC' } });
  }

  createRule(dto: CreateRuleDto): Promise<CourtRule> {
    return this.rules.save(
      this.rules.create({
        ...dto,
        jurisdiction: dto.jurisdiction ?? 'CN',
        description: dto.description ?? null,
        active: dto.active ?? true,
        position: dto.position ?? 0,
        steps: dto.steps as DeadlineRuleLike['steps'],
      }),
    );
  }

  findHolidays(): Promise<CourtHoliday[]> {
    return this.holidays.find({ order: { date: 'ASC', id: 'ASC' } });
  }

  createHoliday(dto: CreateHolidayDto): Promise<CourtHoliday> {
    return this.holidays.save(
      this.holidays.create({ ...dto, jurisdiction: dto.jurisdiction ?? 'CN' }),
    );
  }

  async removeHoliday(id: number): Promise<{ id: number }> {
    const holiday = await this.holidays.findOne({ where: { id } });
    if (!holiday) throw new NotFoundException(`节假日 ${id} 不存在`);
    await this.holidays.remove(holiday);
    return { id };
  }

  // ---------------- 期限计算 ----------------

  private async findCalculation(id: number): Promise<DeadlineCalculation> {
    const calculation = await this.calculations.findOne({ where: { id } });
    if (!calculation) throw new NotFoundException(`期限计算 ${id} 不存在`);
    return calculation;
  }

  async calculateDeadline(dto: CalculateDeadlineDto): Promise<DeadlineCalculation> {
    const rule = await this.rules.findOne({ where: { id: dto.ruleId } });
    if (!rule) throw new BadRequestException('期限规则不存在');
    const holidays = await this.holidays.find();
    const items = computeDeadlineItems(rule, dto.triggerDate, [], holidays);
    const calculation = this.calculations.create({
      title: dto.title?.trim() || rule.name,
      ruleId: rule.id,
      matterId: dto.matterId ?? null,
      ownerId: dto.ownerId ?? null,
      triggerDate: toDate(dto.triggerDate),
      status: 'draft',
      note: dto.note ?? null,
      items,
    });
    return this.calculations.save(calculation);
  }

  findDeadlines(query: DeadlineQueryDto = {}): Promise<DeadlineCalculation[]> {
    const where: FindOptionsWhere<DeadlineCalculation> = {};
    if (query.status) where.status = query.status as DeadlineStatus;
    if (query.matterId !== undefined) where.matterId = query.matterId;
    return this.calculations.find({ where, order: { createdAt: 'DESC', id: 'DESC' } });
  }

  getDeadline(id: number): Promise<DeadlineCalculation> {
    return this.findCalculation(id);
  }

  async recalculateDeadline(id: number, dto: UpdateTriggerDto): Promise<DeadlineCalculation> {
    const calculation = await this.findCalculation(id);
    const rule = await this.rules.findOne({ where: { id: calculation.ruleId } });
    if (!rule) throw new BadRequestException('期限规则不存在');
    const holidays = await this.holidays.find();
    calculation.triggerDate = toDate(dto.triggerDate);
    calculation.items = computeDeadlineItems(rule, dto.triggerDate, calculation.items ?? [], holidays);
    return this.calculations.save(calculation);
  }

  async updateDeadlineStatus(
    id: number,
    dto: UpdateDeadlineStatusDto,
  ): Promise<DeadlineCalculation> {
    const calculation = await this.findCalculation(id);
    calculation.status = dto.status as DeadlineStatus;
    return this.calculations.save(calculation);
  }

  async removeDeadline(id: number): Promise<{ id: number }> {
    const calculation = await this.findCalculation(id);
    await this.calculations.remove(calculation);
    return { id };
  }

  async deadlineToEvents(id: number): Promise<{ created: number; tasks: Task[] }> {
    const calculation = await this.findCalculation(id);
    const tasks: Task[] = [];
    const items = [...(calculation.items ?? [])];
    for (const item of items) {
      if (item.taskId) continue;
      const task = await this.tasks.save(
        this.tasks.create({
          title: `${calculation.title} · ${item.label}`,
          type: 'deadline',
          description: calculation.note ?? null,
          dueDate: new Date(item.dueDate),
          priority: 'high',
          done: false,
          matterId: calculation.matterId ?? null,
          assigneeId: calculation.ownerId ?? null,
          calendarId: calculation.matterId ? `matter:${calculation.matterId}` : 'firm',
          visibility: 'firm',
          sourceType: 'deadline',
          sourceId: calculation.id,
          sourceDetail: item.code,
        }),
      );
      item.taskId = task.id;
      tasks.push(task);
    }
    calculation.items = items;
    await this.calculations.save(calculation);
    return { created: tasks.length, tasks };
  }

  // ---------------- 时效 ----------------

  private statuteDueDate(causeDate: Date, periodDays: number): Date {
    const due = addDays(toDate(causeDate), periodDays);
    due.setHours(23, 59, 0, 0);
    return due;
  }

  private withDaysLeft(statute: Statute): StatuteWithDaysLeft {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(statute.dueDate);
    due.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    return { ...statute, daysLeft };
  }

  async findStatutes(query: StatuteQueryDto = {}): Promise<StatuteWithDaysLeft[]> {
    const qb = this.statutes.createQueryBuilder('statute');
    if (query.status) qb.andWhere('statute.status = :status', { status: query.status });
    if (query.matterId !== undefined) {
      qb.andWhere('statute.matterId = :matterId', { matterId: query.matterId });
    }
    if (query.search) qb.andWhere('statute.title LIKE :search', { search: `%${query.search}%` });
    const list = await qb.orderBy('statute.dueDate', 'ASC').getMany();
    return list.map((item) => this.withDaysLeft(item));
  }

  createStatute(dto: CreateStatuteDto): Promise<Statute> {
    return this.statutes.save(
      this.statutes.create({
        ...dto,
        matterId: dto.matterId ?? null,
        ownerId: dto.ownerId ?? null,
        note: dto.note ?? null,
        alertDays: dto.alertDays ?? 30,
        status: (dto.status ?? 'tracking') as StatuteStatus,
        dueDate: this.statuteDueDate(dto.causeDate, dto.periodDays),
      }),
    );
  }

  async updateStatute(id: number, dto: UpdateStatuteDto): Promise<Statute> {
    const statute = await this.statutes.findOne({ where: { id } });
    if (!statute) throw new NotFoundException(`时效记录 ${id} 不存在`);
    Object.assign(statute, dto);
    statute.dueDate = this.statuteDueDate(statute.causeDate, statute.periodDays);
    return this.statutes.save(statute);
  }

  async removeStatute(id: number): Promise<{ id: number }> {
    const statute = await this.statutes.findOne({ where: { id } });
    if (!statute) throw new NotFoundException(`时效记录 ${id} 不存在`);
    await this.statutes.remove(statute);
    return { id };
  }

  // ---------------- 文本日期识别 ----------------

  async extractDates(dto: ExtractDatesDto): Promise<CalendarDraftEvent[]> {
    let text = dto.text?.trim() ?? '';
    let document: Document | null = null;
    if (dto.documentId !== undefined) {
      document = await this.documents.findOne({ where: { id: dto.documentId } });
      if (!document) throw new NotFoundException(`文档 ${dto.documentId} 不存在`);
      text = (document.content ?? document.description ?? document.title ?? '').trim();
    }
    if (!text) throw new BadRequestException('请提供待识别的文本或文档');

    const sourceName = dto.sourceName?.trim() || document?.title || '文本粘贴';
    const existing = await this.drafts.find({ where: { sourceName } });
    const seen = new Set(
      existing.map(
        (item) =>
          `${item.sourceName}|${new Date(item.extractedDate).getTime()}|${item.sourceSnippet}`,
      ),
    );

    const created: CalendarDraftEvent[] = [];
    const regex = /(\d{4})\s*[年\-/.]\s*(\d{1,2})\s*[月\-/.]\s*(\d{1,2})\s*日?/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (month < 1 || month > 12 || day < 1 || day > 31) continue;

      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
      const extractedDate = new Date(year, month - 1, day, 9, 0, 0, 0);
      const key = `${sourceName}|${extractedDate.getTime()}|${snippet}`;
      if (seen.has(key)) continue;
      seen.add(key);

      let keyword = '日期';
      for (const matcher of KEYWORD_MATCHERS) {
        const found = matcher.words.find((word) => snippet.includes(word));
        if (found) {
          keyword = found;
          break;
        }
      }

      created.push(
        await this.drafts.save(
          this.drafts.create({
            documentId: document?.id ?? null,
            matterId: dto.matterId ?? document?.matterId ?? null,
            sourceName,
            sourceSnippet: snippet,
            extractedDate,
            keyword,
            title: `${keyword}：${snippet.slice(0, 24)}`,
            status: 'draft',
            taskId: null,
          }),
        ),
      );
    }
    return created;
  }

  findDrafts(query: DraftQueryDto = {}): Promise<CalendarDraftEvent[]> {
    const where: FindOptionsWhere<CalendarDraftEvent> = {};
    if (query.status) where.status = query.status as CalendarDraftEvent['status'];
    return this.drafts.find({ where, order: { createdAt: 'DESC', id: 'DESC' } });
  }

  async updateDraft(id: number, dto: UpdateDraftDto): Promise<CalendarDraftEvent> {
    const draft = await this.drafts.findOne({ where: { id } });
    if (!draft) throw new NotFoundException(`识别草稿 ${id} 不存在`);
    draft.status = dto.status;
    if (dto.title?.trim()) draft.title = dto.title.trim();

    if (dto.status === 'confirmed') {
      const document = draft.documentId
        ? await this.documents.findOne({ where: { id: draft.documentId } })
        : null;
      const dueDate = dto.dueDate ?? draft.extractedDate;
      const task = await this.tasks.save(
        this.tasks.create({
          title: draft.title,
          type: taskTypeForKeyword(draft.keyword),
          description: `来源：${draft.sourceName}\n${draft.sourceSnippet}`,
          dueDate: toDate(dueDate),
          matterId: draft.matterId ?? document?.matterId ?? null,
          assigneeId: null,
          calendarId: 'firm',
          visibility: 'firm',
          priority: 'medium',
          sourceType: 'document',
          sourceId: draft.documentId ?? null,
          sourceDetail: draft.sourceName,
        }),
      );
      draft.taskId = task.id;
    }
    return this.drafts.save(draft);
  }

  async removeDraft(id: number): Promise<{ id: number }> {
    const draft = await this.drafts.findOne({ where: { id } });
    if (!draft) throw new NotFoundException(`识别草稿 ${id} 不存在`);
    await this.drafts.remove(draft);
    return { id };
  }

  // ---------------- ICS 导入导出 ----------------

  private icsEscape(value: string | null | undefined): string {
    return String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  private icsUnescape(value: string): string {
    return value.replace(/\\([n,;\\])/g, (_, char: string) => (char === 'n' ? '\n' : char));
  }

  private icsFormatDate(date: Date, allDay: boolean): string {
    const value = toDate(date);
    if (allDay) {
      return `${value.getFullYear()}${String(value.getMonth() + 1).padStart(2, '0')}${String(
        value.getDate(),
      ).padStart(2, '0')}`;
    }
    return `${value.getUTCFullYear()}${String(value.getUTCMonth() + 1).padStart(2, '0')}${String(
      value.getUTCDate(),
    ).padStart(2, '0')}T${String(value.getUTCHours()).padStart(2, '0')}${String(
      value.getUTCMinutes(),
    ).padStart(2, '0')}${String(value.getUTCSeconds()).padStart(2, '0')}Z`;
  }

  async exportIcs(query: IcsQueryDto = {}): Promise<string> {
    const qb = this.applyEventFilters(this.eventQuery(), query);
    const tasks = await qb.getMany();
    const stamp = this.icsFormatDate(new Date(), false);
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LexDesk//Calendar//CN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];
    for (const task of tasks) {
      const start = task.startDate ?? task.dueDate;
      if (!start) continue;
      const allDay = Boolean(task.allDay);
      const end =
        task.endDate ??
        (allDay
          ? addDays(start, 1)
          : new Date(toDate(start).getTime() + 60 * 60 * 1000));
      lines.push(
        'BEGIN:VEVENT',
        `UID:task-${task.id}@lexdesk`,
        `DTSTAMP:${stamp}`,
        allDay
          ? `DTSTART;VALUE=DATE:${this.icsFormatDate(start, true)}`
          : `DTSTART:${this.icsFormatDate(start, false)}`,
        allDay
          ? `DTEND;VALUE=DATE:${this.icsFormatDate(end, true)}`
          : `DTEND:${this.icsFormatDate(end, false)}`,
        `SUMMARY:${this.icsEscape(task.title)}`,
        `DESCRIPTION:${this.icsEscape(task.description)}`,
        'END:VEVENT',
      );
    }
    lines.push('END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
  }

  private parseIcsDate(value: string): { date: Date; allDay: boolean } | null {
    const raw = value.trim();
    const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(raw);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const allDay = match[4] === undefined;
    const hour = Number(match[4] ?? 9);
    const minute = Number(match[5] ?? 0);
    const second = Number(match[6] ?? 0);
    const date = match[7]
      ? new Date(Date.UTC(year, month - 1, day, hour, minute, second))
      : new Date(year, month - 1, day, hour, minute, second);
    return Number.isNaN(date.getTime()) ? null : { date, allDay };
  }

  async importIcs(dto: ImportIcsDto): Promise<{ imported: number; skipped: number; events: Task[] }> {
    const unfolded: string[] = [];
    for (const line of dto.content.replace(/\r\n/g, '\n').split('\n')) {
      if (/^[ \t]/.test(line) && unfolded.length) {
        unfolded[unfolded.length - 1] += line.slice(1);
      } else {
        unfolded.push(line);
      }
    }

    const blocks: string[][] = [];
    let current: string[] | null = null;
    for (const line of unfolded) {
      if (line.trim() === 'BEGIN:VEVENT') {
        current = [];
      } else if (line.trim() === 'END:VEVENT') {
        if (current) blocks.push(current);
        current = null;
      } else if (current) {
        current.push(line);
      }
    }

    let imported = 0;
    let skipped = 0;
    const events: Task[] = [];
    for (const block of blocks) {
      const props = new Map<string, string>();
      for (const line of block) {
        const separator = line.indexOf(':');
        if (separator < 0) continue;
        const name = line.slice(0, separator).split(';')[0].toUpperCase();
        if (!props.has(name)) props.set(name, line.slice(separator + 1));
      }
      const title = this.icsUnescape(props.get('SUMMARY') ?? '').trim();
      const startValue = props.get('DTSTART');
      const parsedStart = startValue ? this.parseIcsDate(startValue) : null;
      if (!title || !parsedStart) {
        skipped += 1;
        continue;
      }
      const endValue = props.get('DTEND');
      const parsedEnd = endValue ? this.parseIcsDate(endValue) : null;

      const existing = await this.tasks.find({ where: { title } });
      const duplicate = existing.some((task) => {
        const start = task.startDate ?? task.dueDate;
        return start && toDate(start).getTime() === parsedStart.date.getTime();
      });
      if (duplicate) {
        skipped += 1;
        continue;
      }

      const task = await this.tasks.save(
        this.tasks.create({
          title,
          type: 'task',
          description: this.icsUnescape(props.get('DESCRIPTION') ?? ''),
          startDate: parsedStart.date,
          endDate: parsedEnd?.date ?? null,
          dueDate: parsedEnd?.date ?? parsedStart.date,
          allDay: parsedStart.allDay,
          calendarId: dto.calendarId ?? 'firm',
          visibility: 'firm',
          sourceType: 'ics',
          sourceId: null,
          sourceDetail: 'ICS 导入',
        }),
      );
      events.push(task);
      imported += 1;
    }
    return { imported, skipped, events };
  }

  // ---------------- 提醒 ----------------

  private reminderSendAt(task: Task | null, leadMinutes: number): Date {
    const due = task?.dueDate ? toDate(task.dueDate) : new Date();
    return new Date(due.getTime() - leadMinutes * 60 * 1000);
  }

  async findReminders(query: ReminderQueryDto = {}): Promise<CalendarReminder[]> {
    const list = await this.reminders.find({
      relations: { task: true },
      order: { sendAt: 'ASC', id: 'ASC' },
    });
    const result: CalendarReminder[] = [];
    for (const reminder of list) {
      if (reminder.task?.dueDate) {
        const sendAt = this.reminderSendAt(reminder.task, reminder.leadMinutes);
        if (sendAt.getTime() !== toDate(reminder.sendAt).getTime()) {
          reminder.sendAt = sendAt;
          await this.reminders.save(reminder);
        }
      }
      if (query.status && reminder.status !== query.status) continue;
      if (query.from && toDate(reminder.sendAt) < toDate(query.from)) continue;
      if (query.to && toDate(reminder.sendAt) > toDate(query.to)) continue;
      result.push(reminder);
    }
    return result;
  }

  async createReminder(dto: CreateReminderDto): Promise<CalendarReminder> {
    const task = await this.tasks.findOne({ where: { id: dto.taskId } });
    if (!task) throw new NotFoundException(`日程 ${dto.taskId} 不存在`);
    if (!task.dueDate) throw new BadRequestException('该日程没有截止日期，无法计算提醒时间');
    const status = (dto.status ?? 'pending') as CalendarReminder['status'];
    return this.reminders.save(
      this.reminders.create({
        taskId: task.id,
        channel: dto.channel as ReminderChannel,
        recipient: dto.recipient ?? null,
        leadMinutes: dto.leadMinutes,
        sendAt: this.reminderSendAt(task, dto.leadMinutes),
        status,
        message: dto.message ?? `${task.title} 即将到期`,
        sentAt: status === 'sent' ? new Date() : null,
      }),
    );
  }

  async updateReminder(id: number, dto: UpdateReminderDto): Promise<CalendarReminder> {
    const reminder = await this.reminders.findOne({ where: { id }, relations: { task: true } });
    if (!reminder) throw new NotFoundException(`提醒 ${id} 不存在`);
    const channel = dto.channel as ReminderChannel | undefined;
    Object.assign(reminder, {
      ...(channel ? { channel } : {}),
      ...(dto.recipient !== undefined ? { recipient: dto.recipient } : {}),
      ...(dto.leadMinutes !== undefined ? { leadMinutes: dto.leadMinutes } : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.message !== undefined ? { message: dto.message } : {}),
    });
    if (dto.status === 'sent') reminder.sentAt = new Date();
    if (dto.status && dto.status !== 'sent') reminder.sentAt = null;
    if (reminder.task?.dueDate) {
      reminder.sendAt = this.reminderSendAt(reminder.task, reminder.leadMinutes);
    }
    return this.reminders.save(reminder);
  }

  async removeReminder(id: number): Promise<{ id: number }> {
    const reminder = await this.reminders.findOne({ where: { id } });
    if (!reminder) throw new NotFoundException(`提醒 ${id} 不存在`);
    await this.reminders.remove(reminder);
    return { id };
  }

  // ---------------- 日程与工时联动 ----------------

  async unloggedEvents(query: TimeLinkQueryDto = {}): Promise<Task[]> {
    const qb = this.eventQuery()
      .leftJoin('time_entries', 'logged', 'logged.sourceTaskId = task.id')
      .where('task.dueDate IS NOT NULL')
      .andWhere('logged.id IS NULL');
    if (query.matterId !== undefined) {
      qb.andWhere('task.matterId = :matterId', { matterId: query.matterId });
    }
    if (query.from) qb.andWhere('task.dueDate >= :from', { from: query.from });
    if (query.to) qb.andWhere('task.dueDate <= :to', { to: query.to });
    return qb.orderBy('task.dueDate', 'ASC').getMany();
  }

  loggedEntries(): Promise<TimeEntry[]> {
    return this.entries
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.task', 'task')
      .leftJoinAndSelect('entry.matter', 'matter')
      .leftJoinAndSelect('entry.user', 'user')
      .where('entry.sourceTaskId IS NOT NULL')
      .orderBy('entry.date', 'DESC')
      .addOrderBy('entry.id', 'DESC')
      .getMany();
  }

  async logTime(dto: CreateTimeLinkDto): Promise<TimeEntry> {
    const task = await this.tasks.findOne({ where: { id: dto.taskId } });
    if (!task) throw new NotFoundException(`日程 ${dto.taskId} 不存在`);
    if (!task.matterId) throw new BadRequestException('该日程未关联案件，无法记录工时');

    let user: User | null = null;
    if (task.assigneeId) {
      user = await this.users.findOne({ where: { id: task.assigneeId } });
    }
    if (!user) {
      user = await this.users.findOne({ order: { id: 'ASC' } });
    }
    if (!user) throw new BadRequestException('系统尚无可用人员，无法记录工时');

    const rate = dto.rate ?? 800;
    const date = dto.date ?? task.dueDate ?? new Date();
    return this.entries.save(
      this.entries.create({
        matterId: task.matterId,
        userId: user.id,
        date: toDate(date),
        hours: dto.hours,
        description: dto.description?.trim() || task.title,
        billable: dto.billable ?? true,
        rate,
        amount: Math.round(dto.hours * rate * 100) / 100,
        invoiced: false,
        invoiceId: null,
        sourceTaskId: task.id,
      }),
    );
  }
}
