import { IsString, IsNotEmpty, IsInt, IsDecimal, IsEnum, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum StatusPaket {
  DRAFT = 'draft',
  AKTIF = 'aktif',
  NON_AKTIF = 'non_aktif'
}

export class CreateDetailRuteDto {
  @ApiProperty({ description: 'Urutan destinasi dalam rute' })
  @IsInt()
  @Type(() => Number)
  urutanKe: number;

  @ApiProperty({ description: 'Nama destinasi' })
  @IsString()
  @IsNotEmpty()
  namaDestinasi: string;

  @ApiProperty({ description: 'Alamat destinasi' })
  @IsString()
  @IsNotEmpty()
  alamatDestinasi: string;

  @ApiProperty({ description: 'Jarak dari destinasi sebelumnya (km)' })
  @IsInt()
  @Type(() => Number)
  jarakDariSebelumnyaKm: number;

  @ApiProperty({ description: 'Estimasi waktu tempuh (menit)' })
  @IsInt()
  @Type(() => Number)
  estimasiWaktuTempuh: number;

  @ApiProperty({ description: 'Waktu kunjungan (menit)' })
  @IsInt()
  @Type(() => Number)
  waktuKunjunganMenit: number;

  @ApiProperty({ description: 'Deskripsi singkat destinasi', required: false })
  @IsOptional()
  @IsString()
  deskripsiSingkat?: string;
}

export class CreatePaketWisataLuarKotaDto {
  @ApiProperty({ description: 'Nama paket wisata' })
  @IsString()
  @IsNotEmpty()
  namaPaket: string;

  @ApiProperty({ description: 'Tujuan utama wisata' })
  @IsString()
  @IsNotEmpty()
  tujuanUtama: string;

  @ApiProperty({ description: 'Total jarak perjalanan (km)' })
  @IsInt()
  @Type(() => Number)
  totalJarakKm: number;

  @ApiProperty({ description: 'Estimasi durasi perjalanan (jam)' })
  @IsInt()
  @Type(() => Number)
  estimasiDurasi: number;

  @ApiProperty({ description: 'Harga estimasi paket' })
  @IsDecimal()
  @Transform(({ value }) => parseFloat(value))
  hargaEstimasi: number;

  @ApiProperty({ enum: StatusPaket, description: 'Status paket wisata' })
  @IsEnum(StatusPaket)
  statusPaket: StatusPaket;

  @ApiProperty({ type: [CreateDetailRuteDto], description: 'Detail rute perjalanan' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetailRuteDto)
  detailRute: CreateDetailRuteDto[];
}