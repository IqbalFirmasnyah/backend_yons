import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsInt, Min, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDetailRuteDto } from './create_detail_rute.dto'; // Adjust path if necessary

export class UpdateDetailRuteDto extends PartialType(CreateDetailRuteDto) {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  ruteId?: number; // Optional as it's the primary key, used in WHERE clause for update

  // Re-declaring for explicit optionality and validation rules (even though PartialType handles type)
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  paketLuarKotaId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  urutanKe?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  namaDestinasi?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  alamatDestinasi?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  jarakDariSebelumnyaKm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  estimasiWaktuTempuh?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  waktuKunjunganMenit?: number;

  @IsOptional()
  @IsString()
  deskripsiSingkat?: string;
}