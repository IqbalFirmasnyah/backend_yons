import {
  IsString, IsInt, IsOptional, IsEnum, IsNotEmpty,
  Min, MaxLength, IsISO8601, ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum StatusPaket {
  AKTIF = 'aktif',
  NON_AKTIF = 'non_aktif',
}

export class CreateDetailRuteDto {
  @IsInt() @Min(1) @Type(() => Number) urutanKe: number;
  @IsString() @IsNotEmpty() namaDestinasi: string;
  @IsString() @IsNotEmpty() alamatDestinasi: string;
  @IsInt() @Min(0) @Type(() => Number) jarakDariSebelumnyaKm: number;
  @IsInt() @Min(0) @Type(() => Number) estimasiWaktuTempuh: number;
  @IsInt() @Min(0) @Type(() => Number) waktuKunjunganMenit: number;
 
  @IsOptional() @IsString() deskripsiSingkat?: string | null;
}

export class CreatePaketWisataLuarKotaDto {
  @IsString() @IsNotEmpty() @MaxLength(100) namaPaket: string;
  @IsString() @IsNotEmpty() @MaxLength(100) tujuanUtama: string;

  @IsInt() @Min(0) @Type(() => Number) totalJarakKm: number;
  @IsInt() @Min(0) @Type(() => Number) estimasiDurasi: number;

  // kirim string supaya mudah dikonversi ke Prisma.Decimal di service
  @IsString() @IsNotEmpty() hargaEstimasi: string;

  @IsEnum(StatusPaket) statusPaket: StatusPaket;

  // Tanggal: kirim 'YYYY-MM-DD' atau ISO; validasi ISO aman
  @IsISO8601() @IsNotEmpty() pilihTanggal: string;

  @IsOptional() @IsString() durasi?: string;
  @IsOptional() @IsString() deskripsi?: string;

  // Jika kamu pakai relasi fasilitas → optional
  @IsOptional() fasilitasIds?: number[];

  @ValidateNested({ each: true })
  @Type(() => CreateDetailRuteDto)
  detailRute: CreateDetailRuteDto[];
}
