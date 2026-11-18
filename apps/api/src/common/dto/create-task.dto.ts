import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { TASK_PRIORITIES, TASK_TYPES, TaskPriority, TaskType } from '../../database/entities';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsIn(TASK_TYPES)
  type: TaskType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriority;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsInt()
  matterId?: number;

  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completedAt?: Date;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
