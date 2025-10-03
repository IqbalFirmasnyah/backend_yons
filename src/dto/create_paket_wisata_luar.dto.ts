import {
  IsString,
  IsInt,
  IsDecimal,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum StatusPaket {
  AKTIF = 'aktif',
  NON_AKTIF = 'non_aktif',
}

export class CreateDetailRuteDto {
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
  @Min(0)
  @Type(() => Number)
  estimasiWaktuTempuh: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  waktuKunjunganMenit: number;

  @IsOptional()
  @IsString()
  deskripsiSingkat?: string;
}

export class CreatePaketWisataLuarKotaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  namaPaket: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tujuanUtama: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  totalJarakKm: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  estimasiDurasi: number;

  @IsDecimal({ decimal_digits: '0,2' })
  @IsNotEmpty()
  hargaEstimasi: string;

  @IsEnum(StatusPaket)
  statusPaket: StatusPaket;
  @ApiProperty({ type: [String], example: ['image-1.jpg', 'image-2.jpg'] })
  fotoPaketLuar: string[];

  // Tambahan field untuk pemilihan tanggal
  @IsISO8601() // Validasi format tanggal ISO8601 (e.g., "2025-07-10")
  @IsNotEmpty()
  pilihTanggal: string; // Input tanggal dari user sebagai string

  @IsOptional()
  @IsString()
  durasi?: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsOptional()
  @IsInt({ each: true }) // Memastikan setiap item dalam array adalah integer
  fasilitasIds?: number[];

  @Type(() => CreateDetailRuteDto)
  detailRute: CreateDetailRuteDto[];
}
