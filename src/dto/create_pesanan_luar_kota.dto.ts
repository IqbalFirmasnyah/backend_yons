import { IsNumber, IsString, IsDate, IsOptional, IsEnum } from 'class-validator';
import { StatusPesanan } from '../database/entities/pesanan.entity';

export class CreatePesananLuarKotaDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  paketLuarKotaId: number;

  @IsNumber()
  supirId: number;

  @IsNumber()
  armadaId: number;

  @IsOptional()
  @IsNumber()
  bookingId?: number; // Nullable

  @IsOptional()
  @IsString()
  inputTujuan?: string; // Nullable

  @IsDate()
  tanggalPesan: Date;

  @IsDate()
  tanggalMulaiWisata: Date;

  @IsDate()
  tanggalSelesaiWisata: Date;

  @IsNumber()
  jumlahPeserta: number;

  @IsNumber()
  totalHargaFinal: number;

  @IsOptional()
  @IsEnum(StatusPesanan)
  statusPesanan?: StatusPesanan; // Optional, default to PENDING

  @IsOptional()
  @IsString()
  catatanKhusus?: string; // Nullable
}
