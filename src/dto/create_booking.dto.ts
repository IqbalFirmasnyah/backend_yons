import { IsNotEmpty, IsString, IsInt, IsOptional, IsDateString, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  // Mutual exclusivity logic using @ValidateIf is correctly implemented here
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => !o.paketLuarKotaId && !o.fasilitasId)
  paketId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => !o.paketId && !o.fasilitasId)
  paketLuarKotaId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => !o.paketId && !o.paketLuarKotaId)
  fasilitasId?: number;

  @IsDateString() // Correctly validates ISO 8601 date string
  @IsNotEmpty()
  tanggalMulaiWisata: string; // Stays as string for DTO input

  @IsDateString() // Correctly validates ISO 8601 date string
  @IsNotEmpty()
  tanggalSelesaiWisata: string; // Stays as string for DTO input

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  jumlahPeserta: number;

  @IsOptional()
  @IsString()
  inputCustomTujuan?: string;

  @IsOptional()
  @IsString()
  catatanKhusus?: string;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  supirId: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  armadaId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimasiHargaTotal?: number;
}