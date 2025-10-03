import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsInt, IsDateString, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePesananDto } from './create_pesanan.dto'; // Adjust path

// Assuming you might have an enum for status, if not, it's just a string
export enum PesananStatusEnum {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class UpdatePesananDto extends PartialType(CreatePesananDto) {
  // All properties from CreatePesananDto are now optional due to PartialType.
  // We explicitly re-add @IsOptional() for class-validator clarity and stricter control.

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  paketId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  supirId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  armadaId?: number;

  @IsOptional()
  @IsDateString()
  tanggalMulaiWisata?: string;

  @IsOptional()
  @IsDateString()
  tanggalSelesaiWisata?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  jumlahPeserta?: number;

  @IsOptional()
  @IsString()
  catatanKhusus?: string;

  @IsOptional()
  @IsEnum(PesananStatusEnum)
  statusPesanan?: PesananStatusEnum; // Allow updating status
}