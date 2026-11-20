import { Controller, Get } from '@nestjs/common';
import { MattersService } from './matters.service';

@Controller('matter-stages')
export class MatterStagesController {
  constructor(private readonly service: MattersService) {}

  @Get()
  findAll() {
    return this.service.listStages();
  }
}
