import { IsString, IsInt, IsOptional, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDetailRuteDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  paketLuarKotaId: number; // Required for direct creation of DetailRuteLuarKota

  @IsInt()
  @Min(1)
  @Type(() => Number)
  urutanKe: number;

  @IsString()
  @IsNotEmpty()
  namaDestinasi: string;

  @IsString()
  @IsNotEmpty()
  alamatDestinasi: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  jarakDariSebelumnyaKm: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  estimasiWaktuTempuh: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  waktuKunjunganMenit: number;

  @IsOptional()
  @IsString()
  deskripsiSingkat?: string;
}