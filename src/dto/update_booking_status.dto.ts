import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusBooking } from '../database/entities/booking.entity';

export class UpdateBookingStatusDto {
  @IsEnum(StatusBooking)
  status_booking: StatusBooking;

  @IsOptional()
  @IsString()
  keterangan?: string;
}