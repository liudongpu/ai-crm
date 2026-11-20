import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('me')
  me(@Query('userId') userId?: string) {
    return this.service.forUser(userId ? Number(userId) : undefined);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { enabled: boolean }) {
    return this.service.update(id, body.enabled);
  }
}
