// src/dto/paket_wisata_response.dto.ts
import { IsInt, IsString, IsDecimal, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaketWisataResponseDto {
  @IsInt()
  paketId: number;

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

  @IsInt()
  jarakKm: number;

  @IsInt()
  durasiHari: number;

  @IsDate()
  @Type(() => Date)
  pilihTanggal: Date; // Added pilihTanggal

  @IsDecimal({ decimal_digits: '2' }) // Use IsDecimal here as well if price can have decimals
  harga: number;

  @IsOptional()
  @IsString()
  fotoPaket?: string;

  @ApiProperty({ type: [String], example: ['image-1.jpg', 'image-2.jpg'] })
  images: string[];

  @IsString()
  kategori: string;

  @IsString()
  statusPaket: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  // New calculated date fields
  @IsDate()
  tanggalMulaiWisata: Date;

  @IsDate()
  tanggalSelesaiWisata: Date;
}

