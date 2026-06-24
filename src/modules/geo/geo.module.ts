import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GeoController } from 'src/controllers/geo.controller';
import { GeoService } from 'src/services/geo.service'; 

@Module({
  imports: [
    HttpModule,
    ThrottlerModule.forRoot([{ ttl: 60, limit: 60 }]), // 60 req/menit/IP
  ],
  controllers: [GeoController],
  providers: [
    GeoService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [GeoService],
})
export class GeoModule {}
