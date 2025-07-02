import { IsInt, IsDateString, IsString, IsDecimal, IsOptional, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePesananDto {
  @ApiProperty({ description: 'ID User yang melakukan pesanan' })
  @IsInt()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ description: 'ID Paket Wisata' })
  @IsInt()
  @Type(() => Number)
  paketId: number;

  @ApiProperty({ description: 'ID Supir' })
  @IsInt()
  @Type(() => Number)
  supirId: number;

  @ApiProperty({ description: 'ID Armada' })
  @IsInt()
  @Type(() => Number)
  armadaId: number;

  @ApiProperty({ description: 'Tanggal mulai wisata', example: '2024-03-15' })
  @IsDateString()
  tanggalMulaiWisata: string;

  @ApiProperty({ description: 'Tanggal selesai wisata', example: '2024-03-17' })
  @IsDateString()
  tanggalSelesaiWisata: string;

  @ApiProperty({ description: 'Jumlah peserta', minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  jumlahPeserta: number;

  @ApiProperty({ description: 'Total harga pesanan', example: '1500000.00' })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => parseFloat(value))
  totalHarga: number;

  @ApiPropertyOptional({ description: 'Catatan khusus untuk pesanan' })
  @IsOptional()
  @IsString()
  catatanKhusus?: string;
}