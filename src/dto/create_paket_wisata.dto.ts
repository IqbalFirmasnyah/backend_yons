// src/dto/create_paket_wisata.dto.ts
import { IsString, IsInt, IsDecimal, IsOptional, IsEnum, IsNotEmpty, Min, Max, IsISO8601, IsNumber } from 'class-validator'; // Import IsISO8601 for date string validation
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum KategoriPaket {
  DALAM_KOTA = 'dalam kota',
  LUAR_KOTA = 'luar kota',
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

  @IsISO8601() // Use IsISO8601 to validate date string format (e.g., "2025-07-10")
  @IsNotEmpty()
  pilihTanggal: string; // Changed to string as it often comes from a request body as string

  @IsNumber() // Use IsDecimal for price if it can have decimals, or IsInt if it's always a whole number
  @Type(() => Number) // Ensure it's transformed to a number
  harga: number;

  @IsOptional()
  @IsString()
  fotoPaket?: string | null;


  @IsEnum(KategoriPaket)
  kategori: KategoriPaket;

  @IsEnum(StatusPaket)
  @IsOptional()
  statusPaket?: StatusPaket = StatusPaket.AKTIF;
}