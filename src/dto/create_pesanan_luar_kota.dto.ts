import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional, IsDateString, IsDecimal, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePesananLuarKotaDto {
  @ApiProperty({ description: 'ID paket wisata luar kota' })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  paketLuarKotaId: number;

  @ApiProperty({ description: 'ID supir' })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  supirId: number;

  @ApiProperty({ description: 'ID armada' })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  armadaId: number;

  @ApiProperty({ description: 'Input tujuan custom dari user', required: false })
  @IsOptional()
  @IsString()
  inputTujuanUser?: string;

  @ApiProperty({ description: 'Tanggal mulai wisata' })
  @IsNotEmpty()
  @IsDateString()
  tanggalMulaiWisata: string;

  @ApiProperty({ description: 'Tanggal selesai wisata' })
  @IsNotEmpty()
  @IsDateString()
  tanggalSelesaiWisata: string;

  @ApiProperty({ description: 'Jumlah peserta', minimum: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  jumlahPeserta: number;

  @ApiProperty({ description: 'Total harga final' })
  @IsNotEmpty()
  @IsDecimal()
  totalHargaFinal: number;

  @ApiProperty({ description: 'Catatan khusus', required: false })
  @IsOptional()
  @IsString()
  catatanKhusus?: string;
}