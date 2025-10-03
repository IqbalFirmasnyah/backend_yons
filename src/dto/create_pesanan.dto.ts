import { IsNotEmpty, IsString, IsInt, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePesananDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  userId: number; // User making the order

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  paketId: number; // The package ordered

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  supirId: number; // Driver assigned to the order

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  armadaId: number; // Vehicle assigned to the order

  @IsNotEmpty()
  @IsDateString()
  tanggalMulaiWisata: string; // Start date of the trip

  @IsNotEmpty()
  @IsDateString()
  tanggalSelesaiWisata: string; // End date of the trip

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  jumlahPeserta: number; // Number of participants

  @IsOptional()
  @IsString()
  catatanKhusus?: string; // Special notes for the order

  // totalHarga and statusPesanan will be set/calculated by the service
}