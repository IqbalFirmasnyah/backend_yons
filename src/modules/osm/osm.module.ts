import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NominatimService } from 'src/services/nominatim.service'; 
import { OsrmService } from 'src/services/osrm.service';

@Module({
  imports: [HttpModule],
  providers: [NominatimService, OsrmService],
  exports: [NominatimService, OsrmService],
})
export class OsmModule {}