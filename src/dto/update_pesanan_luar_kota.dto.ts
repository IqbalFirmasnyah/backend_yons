import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsInt, IsString, IsDateString, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePesananLuarKotaDto } from './create_pesanan_luar_kota.dto'; 

export class UpdatePesananLuarKotaDto extends PartialType(CreatePesananLuarKotaDto) {
  
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => o.paketLuarKotaId === undefined) // Only validate fasilitasId if paketLuarKotaId is not present
  fasilitasId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => o.fasilitasId === undefined) // Only validate paketLuarKotaId if fasilitasId is not present
  paketLuarKotaId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  supirId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  armadaId?: number;

  @IsOptional()
  @IsString()
  inputTujuanUser?: string;

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

  // totalHargaFinal is typically calculated, not provided by client
  // You might want to add a status update field here if it's part of the DTO
  // @IsOptional()
  // @IsEnum(PesananStatusEnum) // Assuming you have a PesananStatusEnum
  // statusPesanan?: PesananStatusEnum;
}