import { IsNumber, IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { StatusBooking } from '../database/entities/booking.entity';

export class CreateBookingDto {
  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsNumber()
  paket_id?: number;

  @IsOptional()
  @IsNumber()
  paket_luar_kota_id?: number;

  @IsDateString()
  tanggal_mulai_wisata: string;

  @IsDateString()
  tanggal_selesai_wisata: string;

  @IsNumber()
  jumlah_peserta: number;

  @IsOptional()
  @IsString()
  input_custom_tujuan?: string;

  @IsOptional()
  @IsString()
  catatan_khusus?: string;
}