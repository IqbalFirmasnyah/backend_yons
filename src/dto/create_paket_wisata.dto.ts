import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { KategoriPaket, StatusPaket } from '../database/entities/paket_wisata.entity';

export class CreatePaketWisataDto {
  @IsString()
  namaPaket: string;

  @IsString()
  namaTempat: string;

  @IsString()
  lokasi: string;

  @IsString()
  deskripsi: string;

  @IsString()
  itinerary: string;

  @IsNumber()
  jarakKm: number;

  @IsNumber()
  durasiHari: number;

  @IsNumber()
  harga: number;

  @IsOptional()
  @IsString()
  fotoPaket?: string; // Nullable

  @IsEnum(KategoriPaket)
  kategori: KategoriPaket;

  @IsOptional()
  @IsEnum(StatusPaket)
  statusPaket?: StatusPaket; // Optional, default to AKTIF
}
