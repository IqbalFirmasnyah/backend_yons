import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsDateString, IsDecimal, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePesananLuarKotaDto {
  @ApiProperty({ description: 'ID supir', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  supirId?: number;

  @ApiProperty({ description: 'ID armada', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  armadaId?: number;

  @ApiProperty({ description: 'Input tujuan custom dari user', required: false })
  @IsOptional()
  @IsString()
  inputTujuanUser?: string;

  @ApiProperty({ description: 'Tanggal mulai wisata', required: false })
  @IsOptional()
  @IsDateString()
  tanggalMulaiWisata?: string;

  @ApiProperty({ description: 'Tanggal selesai wisata', required: false })
  @IsOptional()
  @IsDateString()
  tanggalSelesaiWisata?: string;

  @ApiProperty({ description: 'Jumlah peserta', minimum: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  jumlahPeserta?: number;

  @ApiProperty({ description: 'Total harga final', required: false })
  @IsOptional()
  @IsDecimal()
  totalHargaFinal?: number;

  @ApiProperty({ 
    description: 'Status pesanan', 
    enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'],
    required: false 
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'])
  statusPesanan?: string;

  @ApiProperty({ description: 'Catatan khusus', required: false })
  @IsOptional()
  @IsString()
  catatanKhusus?: string;
}