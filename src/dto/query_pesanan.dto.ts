import { IsOptional, IsEnum, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPesananDto {
  @ApiPropertyOptional({ description: 'Filter berdasarkan user ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;

  @ApiPropertyOptional({ description: 'Filter berdasarkan status pesanan' })
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'])
  statusPesanan?: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';

  @ApiPropertyOptional({ description: 'Filter berdasarkan tanggal mulai (dari)' })
  @IsOptional()
  @IsDateString()
  tanggalMulaiDari?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan tanggal mulai (sampai)' })
  @IsOptional()
  @IsDateString()
  tanggalMulaiSampai?: string;

  @ApiPropertyOptional({ description: 'Halaman', default: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Jumlah data per halaman', default: 10 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 10;
}