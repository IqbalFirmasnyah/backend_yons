import { IsNotEmpty, IsString, IsInt, IsOptional, IsDateString, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePesananLuarKotaDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => !o.fasilitasId)
  paketLuarKotaId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => !o.paketLuarKotaId)
  fasilitasId?: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  supirId: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  armadaId: number;

  @IsOptional()
  @IsString()
  inputTujuanUser?: string;

  @IsNotEmpty()
  @IsDateString()
  tanggalMulaiWisata: string;

  @IsNotEmpty()
  @IsDateString()
  tanggalSelesaiWisata: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  jumlahPeserta: number;

  @IsOptional()
  @IsString()
  catatanKhusus?: string;
}