import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { KategoriPaket, StatusPaket } from './create_paket_wisata.dto';

export class PaketWisataQueryDto {
  @IsOptional()
  @IsEnum(KategoriPaket)
  kategori?: KategoriPaket;

  @IsOptional()
  @IsEnum(StatusPaket)
  status?: StatusPaket;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}