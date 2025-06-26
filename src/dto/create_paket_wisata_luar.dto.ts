import { IsString, IsNumber, IsEnum } from 'class-validator';
import { StatusPaket } from '../database/entities/paket_wisata.entity';

export class CreatePaketWisataLuarKotaDto {
  @IsString()
  namaPaket: string;

  @IsString()
  tujuanUtama: string;

  @IsNumber()
  totalJarakKm: number;

  @IsNumber()
  estimasiDurasi: number;

  @IsNumber()
  hargaEstimasi: number;

  @IsEnum(StatusPaket)
  statusPaket?: StatusPaket; // Optional, default to AKTIF
}
