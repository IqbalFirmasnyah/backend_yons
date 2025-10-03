// src/armada/dto/create-armada.dto.ts
import { IsString, IsNumber, IsEnum, Min, Max, IsNotEmpty, IsOptional } from 'class-validator';
import { StatusArmada } from '../database/entities/armada.entity'; 

export class CreateArmadaDto {
  @IsNotEmpty({ message: 'Jenis mobil tidak boleh kosong' })
  @IsString({ message: 'Jenis mobil harus berupa teks' })
  jenisMobil: string;

  @IsNotEmpty({ message: 'Merk mobil tidak boleh kosong' })
  @IsString({ message: 'Merk mobil harus berupa teks' })
  merkMobil: string;

  @IsNotEmpty({ message: 'Plat nomor tidak boleh kosong' })
  @IsString({ message: 'Plat nomor harus berupa teks' })
  platNomor: string;

  @IsNotEmpty({ message: 'Kapasitas tidak boleh kosong' })
  @IsNumber({}, { message: 'Kapasitas harus berupa angka' })
  @Min(1, { message: 'Kapasitas minimal 1' })
  kapasitas: number;

  @IsNotEmpty({ message: 'Tahun kendaraan tidak boleh kosong' })
  @IsNumber({}, { message: 'Tahun kendaraan harus berupa angka' })
  @Min(1900, { message: 'Tahun kendaraan tidak valid' })
  @Max(new Date().getFullYear() + 1, { message: 'Tahun kendaraan tidak valid' }) // Tahun saat ini + 1
  tahunKendaraan: number;

  @IsNotEmpty({ message: 'Status armada tidak boleh kosong' })
  @IsEnum(StatusArmada, { message: `Status armada harus salah satu dari: ${Object.values(StatusArmada).join(', ')}` })
  statusArmada: StatusArmada;

  @IsOptional()
  @IsString({ message: 'Foto armada harus berupa teks' })
  fotoArmada?: string; // Opsional
}

// src/armada/dto/update-armada.dto.ts
import { PartialType } from '@nestjs/mapped-types'; // Atau import langsung dari class-validator jika tidak pakai @nestjs/mapped-types
// Jika Anda tidak menggunakan @nestjs/mapped-types, Anda bisa menyalin properti dari CreateArmadaDto dan membuat semua IsOptional()

export class UpdateArmadaDto extends PartialType(CreateArmadaDto) {}