import { IsOptional, IsNumber, IsString, IsDate, IsEnum } from 'class-validator';
import { StatusPesanan } from '../database/entities/pesanan.entity';

export class UpdatePesananDto {
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsNumber()
  paketId?: number;

  @IsOptional()
  @IsNumber()
  supirId?: number;

  @IsOptional()
  @IsNumber()
  armadaId?: number;

  @IsOptional()
  @IsNumber()
  bookingId?: number; // Nullable

  @IsOptional()
  @IsDate()
  tanggalPesan?: Date;

  @IsOptional()
  @IsDate()
  tanggalMulaiWisata?: Date;

  @IsOptional()
  @IsDate()
  tanggalSelesaiWisata?: Date;

  @IsOptional()
  @IsNumber()
  jumlahPeserta?: number;

  @IsOptional()
  @IsNumber()
  totalHarga?: number;

  @IsOptional()
  @IsEnum(StatusPesanan)
  statusPesanan?: StatusPesanan; // Optional

  @IsOptional()
  @IsString()
  catatanKhusus?: string; // Nullable
}
