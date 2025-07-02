import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateUpdateStatusBookingDto {
  @IsInt()
  bookingId: number;

  @IsString()
  statusLama: string;

  @IsString()
  statusBaru: string;

  @IsOptional()
  @IsInt()
  updatedByUserId?: number;

  @IsOptional()
  @IsInt()
  updatedByAdminId?: number;

  @IsOptional()
  @IsString()
  keterangan?: string;

  @IsDateString()
  timestampUpdate: string;
}
