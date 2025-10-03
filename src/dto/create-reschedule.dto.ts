import { IsInt, IsNotEmpty, IsString, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateRescheduleDto {
  @IsNotEmpty()
  @IsInt()
  bookingId: number;

  @IsNotEmpty()
  @IsDateString()
  tanggalBaru: string;

  @IsNotEmpty()
  @IsString()
  alasan: string;
}