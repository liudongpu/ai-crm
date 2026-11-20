import { Controller, Get, Query } from '@nestjs/common';
import { SearchQueryDto } from '../../../common/dto/special.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  search(@Query() query: SearchQueryDto) {
    return this.service.search(query?.q);
  }
}
