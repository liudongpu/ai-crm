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
import { CreateTaskDto, UpdateTaskDto } from '../../common/dto/create-task.dto';
import { TaskQueryDto } from '../../common/dto/special.dto';
import { TaskTemplate } from '../../database/entities';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get()
  findAll(@Query() query: TaskQueryDto) {
    return this.service.findAll(query ?? {});
  }

  /** 任务模板（静态路由必须在 :id 之前）。 */
  @Get('templates')
  templates() {
    return this.service.templates();
  }

  @Post('templates')
  createTemplate(@Body() data: Partial<TaskTemplate>) {
    return this.service.createTemplate(data);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<TaskTemplate>) {
    return this.service.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  removeTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeTemplate(id);
  }

  @Post('templates/:id/create')
  createFromTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { matterId?: number; assigneeId?: number; dueDate?: string },
  ) {
    return this.service.createFromTemplate(id, {
      matterId: body.matterId,
      assigneeId: body.assigneeId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggle(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
