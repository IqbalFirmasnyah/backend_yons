import { IsString, IsInt, IsDecimal, IsOptional, IsEnum, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum KategoriPaket {
  DALAM_KOTA = 'dalam_kota',
  LUAR_KOTA = 'luar_kota',
}

export enum StatusPaket {
  AKTIF = 'aktif',
  NON_AKTIF = 'non_aktif',
}

export class CreatePaketWisataDto {
  @IsString()
  @IsNotEmpty()
  namaPaket: string;

  @IsString()
  @IsNotEmpty()
  namaTempat: string;

  @IsString()
  @IsNotEmpty()
  lokasi: string;

  @IsString()
  @IsNotEmpty()
  deskripsi: string;

  @IsString()
  @IsNotEmpty()
  itinerary: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  jarakKm: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  durasiHari: number;

  @IsDecimal()
  @Type(() => Number)
  harga: number;

  @IsOptional()
  @IsString()
  fotoPaket?: string;

  @IsEnum(KategoriPaket)
  kategori: KategoriPaket;

  @IsEnum(StatusPaket)
  @IsOptional()
  statusPaket?: StatusPaket = StatusPaket.AKTIF;
}