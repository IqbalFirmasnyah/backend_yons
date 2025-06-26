import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { StatusSupir } from '../database/entities/supir.entity';

export class UpdateSupirDto {
  @IsOptional()
  @IsString()
  nama?: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  nomorHp?: string;

  @IsOptional()
  @IsString()
  nomorSim?: string;

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
  statusSupir?: StatusSupir; // Optional
}
