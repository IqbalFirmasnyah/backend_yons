// src/modules/booking/booking.module.ts
import { Module } from '@nestjs/common';
import { BookingController } from 'src/controllers/booking.controller'; 
import { BookingService } from '../../services/booking.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}