import { IsEnum, IsNotEmpty, IsOptional, IsString, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePaketWisataLuarKotaDto } from './create_paket_wisata_luar.dto'; 

export enum JenisFasilitasEnum {
  PAKET_LUAR_KOTA = 'paket_luar_kota',
  CUSTOM = 'custom',
  DROPOFF = 'dropoff',
}


export class CreateFasilitasDto {
  @IsEnum(JenisFasilitasEnum)
  @IsNotEmpty()
  jenisFasilitas: JenisFasilitasEnum;

  @IsString()
  @IsNotEmpty()
  namaFasilitas: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsOptional()
  @IsInt()
  supirId?: number;

  @IsOptional()
  @IsInt()
  armadaId?: number;

  // ⬇⬇⬇ Ini bagian penting ⬇⬇⬇
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePaketWisataLuarKotaDto)
  paketLuarKota?: CreatePaketWisataLuarKotaDto;
}
