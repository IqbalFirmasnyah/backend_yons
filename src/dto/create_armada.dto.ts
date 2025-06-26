import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { StatusArmada } from '../database/entities/armada.entity';

export class CreateArmadaDto {
  @IsString()
  @IsNotEmpty()
  jenisMobil: string;

  @IsString()
  @IsNotEmpty()
  merkMobil: string;

  @IsString()
  @IsNotEmpty()
  platNomor: string;

  @IsNumber()
  kapasitas: number;

  @IsNumber()
  tahunKendaraan: number;

  @IsEnum(StatusArmada)
  statusArmada: StatusArmada;

  @IsOptional()
  @IsString()
  fotoArmada?: string; // Nullable
}
