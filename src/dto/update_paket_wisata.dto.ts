import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { KategoriPaket, StatusPaket } from '../database/entities/paket_wisata.entity';

export class UpdatePaketWisataDto {
  @IsOptional()
  @IsString()
  namaPaket?: string;

  @IsOptional()
  @IsString()
  namaTempat?: string;

  @IsOptional()
  @IsString()
  lokasi?: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsOptional()
  @IsString()
  itinerary?: string;

  @IsOptional()
  @IsNumber()
  jarakKm?: number;

  @IsOptional()
  @IsNumber()
  durasiHari?: number;

  @IsOptional()
  @IsNumber()
  harga?: number;

  @IsOptional()
  @IsString()
  fotoPaket?: string; // Nullable

  @IsOptional()
  @IsEnum(KategoriPaket)
  kategori?: KategoriPaket;

  @IsOptional()
  @IsEnum(StatusPaket)
  statusPaket?: StatusPaket; // Optional
}
