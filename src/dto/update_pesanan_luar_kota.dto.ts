import { IsOptional, IsNumber, IsString, IsDate, IsEnum } from 'class-validator';
import { StatusPesanan } from '../database/entities/pesanan.entity';

export class UpdatePesananLuarKotaDto {
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsNumber()
  paketLuarKotaId?: number;

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
  @IsString()
  inputTujuan?: string; // Nullable

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
  totalHargaFinal?: number;

  @IsOptional()
  @IsEnum(StatusPesanan)
  statusPesanan?: StatusPesanan; // Optional

  @IsOptional()
  @IsString()
  catatanKhusus?: string; // Nullable
}
