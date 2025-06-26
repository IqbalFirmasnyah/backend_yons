import { IsNumber, IsString, IsOptional, IsDate } from 'class-validator';

export class CreateUpdateStatusBookingDto {
  @IsNumber()
  bookingId: number;

  @IsString()
  statusLama: string;

  @IsString()
  statusBaru: string;

  @IsOptional()
  @IsNumber()
  updatedByUser: any; // Nullable

  @IsOptional()
  @IsNumber()
  updatedByAdminId?: number; // Nullable

  @IsDate()
  timestampUpdate: Date;
}
