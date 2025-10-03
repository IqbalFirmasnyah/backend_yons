import { PartialType } from '@nestjs/swagger';
import { CreatePaketWisataLuarKotaDto } from './create_paket_wisata_luar.dto';
import { IsOptional, IsISO8601 } from 'class-validator';

export class UpdatePaketWisataLuarKotaDto extends PartialType(CreatePaketWisataLuarKotaDto) {
  // Semua field dari CreatePaketWisataLuarKotaDto menjadi optional
  // Termasuk pilihTanggal yang sudah didefinisikan dalam CreatePaketWisataLuarKotaDto
  
  @IsOptional()
  @IsISO8601()
  pilihTanggal?: string; // Override untuk memastikan optional pada update
}