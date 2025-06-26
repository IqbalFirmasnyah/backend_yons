import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'src/database/entities/booking.entity';
import { UpdateStatusBooking } from 'src/database/entities/update_status_booking.entity';
import { BookingService } from 'src/services/booking.service';
import { BookingController } from 'src/controllers/booking.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, UpdateStatusBooking]),
  ],
  providers: [BookingService],
  controllers: [BookingController],
  exports: [BookingService], // Ekspor BookingService jika diperlukan di modul lain
})
export class BookingModule {}
