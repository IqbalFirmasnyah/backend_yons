import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength, IsEnum, IsInt } from 'class-validator';
import { CreateFasilitasDto, JenisFasilitasEnum } from './create-fasilitas.dto'; // Ensure correct path to your CreateFasilitasDto and enum

export class UpdateFasilitasDto extends PartialType(CreateFasilitasDto) {
  // All properties from CreateFasilitasDto are now optional due to PartialType.
  // You can optionally override or add new validation rules here if needed for updates.

  // Example of overriding a rule (though not strictly necessary here as PartialType handles optionality):
  @IsOptional()
  @IsEnum(JenisFasilitasEnum)
  jenisFasilitas?: JenisFasilitasEnum;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  namaFasilitas?: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsOptional()
  @IsInt()
  paketLuarKotaId?: number;
}