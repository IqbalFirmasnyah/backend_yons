import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from 'src/services/geo.service';
import { Public } from 'src/public/public.decorator'; 

@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Public()
  @Get('suggest')
  async suggest(@Query('q') q = '', @Query('limit') limit = '5') {
    const parsed = parseInt(limit, 10);
    return this.geo.suggest(q, Number.isFinite(parsed) ? parsed : 5);
  }
}
