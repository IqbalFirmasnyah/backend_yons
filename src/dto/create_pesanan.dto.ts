import { IsNumber, IsString, IsDate, IsOptional, IsEnum } from 'class-validator';
import { StatusPesanan } from '../database/entities/pesanan.entity';

export class CreatePesananDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  paketId: number;

  @IsNumber()
  supirId: number;

  @IsNumber()
  armadaId: number;

  @IsOptional()
  @IsNumber()
  bookingId?: number; // Nullable

  @IsDate()
  tanggalPesan: Date;

  @IsDate()
  tanggalMulaiWisata: Date;

  @IsDate()
  tanggalSelesaiWisata: Date;

  @IsNumber()
  jumlahPeserta: number;

  @IsNumber()
  totalHarga: number;

  @IsOptional()
  @IsEnum(StatusPesanan)
  statusPesanan?: StatusPesanan; // Optional, default to PENDING

  @IsOptional()
  @IsString()
  catatanKhusus?: string; // Nullable
}
