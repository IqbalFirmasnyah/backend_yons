import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { StatusPaket } from '../database/entities/paket_wisata.entity';

export class UpdatePaketWisataLuarKotaDto {
  @IsOptional()
  @IsString()
  namaPaket?: string;

  @IsOptional()
  @IsString()
  tujuanUtama?: string;

  @IsOptional()
  @IsNumber()
  totalJarakKm?: number;

  @IsOptional()
  @IsNumber()
  estimasiDurasi?: number;

  @IsOptional()
  @IsNumber()
  hargaEstimasi?: number;

  @IsOptional()
  @IsEnum(StatusPaket)
  statusPaket?: StatusPaket; // Optional
}
