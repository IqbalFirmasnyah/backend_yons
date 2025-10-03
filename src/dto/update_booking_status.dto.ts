import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '../services/booking.service';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    description: 'Status booking baru',
    example: BookingStatus.CONFIRMED
  })
  @IsEnum(BookingStatus, {
    message: 'Status booking harus berupa nilai yang valid dari enum BookingStatus'
  })
  @IsNotEmpty({
    message: 'Status booking tidak boleh kosong'
  })
  statusBooking: BookingStatus;
}