import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { StatusSupir } from '../database/entities/supir.entity';

export class CreateSupirDto {
  @IsString()
  nama: string;

  @IsString()
  alamat: string;

  @IsString()
  nomorHp: string;

  @IsString()
  nomorSim: string;

  @IsOptional()
  @IsString()
  fotoSupir?: string; // Nullable

  @IsOptional()
  @IsNumber()
  pengalamanTahun?: number; // Default to 0

  @IsOptional()
  @IsNumber()
  ratingRata?: number; // Default to 0

  @IsOptional()
  @IsEnum(StatusSupir)
  statusSupir?: StatusSupir; // Optional, default to TERSEDIA
}
