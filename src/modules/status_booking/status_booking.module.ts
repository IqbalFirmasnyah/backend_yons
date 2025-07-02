// src/paket-wisata/paket_wisata.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UpdateStatusBookingService } from 'src/services/status_booking.service'; 
import { UpdateStatusBookingController } from 'src/controllers/status_booking.controller'; 


@Module({
    imports: [PrismaModule],
    controllers: [UpdateStatusBookingController],
    providers: [UpdateStatusBookingService],
    exports: [UpdateStatusBookingService]
  })
export class UpdateStatusBookingModule {}

