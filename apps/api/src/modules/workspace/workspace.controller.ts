import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  CreateWorkspaceItemDto,
  UpdateWorkspaceItemDto,
  WorkspaceItemQueryDto,
  WorkspaceSettingQueryDto,
  WorkspaceStatsQueryDto,
} from '../../common/dto/workspace.dto';
import { WorkspaceService } from './workspace.service';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly service: WorkspaceService) {}

  @Get('definitions')
  definitions() {
    return this.service.definitions();
  }

  @Get('definitions/:code')
  definition(@Param('code') code: string) {
    return this.service.definition(code);
  }

  @Get('items')
  findItems(@Query() query: WorkspaceItemQueryDto) {
    return this.service.findItems(query ?? {});
  }

  @Get('items/:id')
  findItem(@Param('id', ParseIntPipe) id: number) {
    return this.service.findItem(id);
  }

  @Post('items')
  createItem(@Body() dto: CreateWorkspaceItemDto) {
    return this.service.createItem(dto);
  }

  @Patch('items/:id')
  updateItem(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkspaceItemDto) {
    return this.service.updateItem(id, dto);
  }

  @Delete('items/:id')
  removeItem(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeItem(id);
  }

  @Get('stats')
  stats(@Query() query: WorkspaceStatsQueryDto) {
    return this.service.stats(query ?? {});
  }

  @Get('settings')
  getSettings(@Query() query: WorkspaceSettingQueryDto) {
    return this.service.getSettings(query ?? {});
  }

  @Put('settings/:featureCode')
  updateSettings(
    @Param('featureCode') featureCode: string,
    @Body() values: Array<{ key: string; value: string }>,
  ) {
    return this.service.updateSettings(featureCode, values ?? []);
  }
}
