import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { StatusArmada } from '../database/entities/armada.entity';

export class UpdateArmadaDto {
  @IsOptional()
  @IsString()
  jenisMobil?: string;

  @IsOptional()
  @IsString()
  merkMobil?: string;

  @IsOptional()
  @IsString()
  platNomor?: string;

  @IsOptional()
  @IsNumber()
  kapasitas?: number;

  @IsOptional()
  @IsNumber()
  tahunKendaraan?: number;

  @IsOptional()
  @IsEnum(StatusArmada)
  statusArmada?: StatusArmada;

  @IsOptional()
  @IsString()
  fotoArmada?: string; // Nullable
}
