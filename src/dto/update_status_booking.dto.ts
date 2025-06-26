import { IsOptional, IsNumber, IsString, IsDate } from 'class-validator';

export class UpdateUpdateStatusBookingDto {
  @IsOptional()
  @IsNumber()
  bookingId?: number;

  @IsOptional()
  @IsString()
  statusLama?: string;

  @IsOptional()
  @IsString()
  statusBaru?: string;

  @IsOptional()
  @IsNumber()
  updatedByUser : any; // Nullable

  @IsOptional()
  @IsNumber()
  updatedByAdminId?: number; // Nullable

  @IsOptional()
  @IsDate()
  timestampUpdate?: Date;
}
