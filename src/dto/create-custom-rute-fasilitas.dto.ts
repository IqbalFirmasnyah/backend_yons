import { IsNotEmpty, IsString, IsDateString, IsOptional, IsArray, ArrayMinSize, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class TujuanDto {
  @IsNotEmpty()
  @IsString()
  nama: string;

  @IsNotEmpty()
  @IsString()
  alamat: string;
}

export class CreateCustomRuteDto {
  @IsNotEmpty()
  @IsNumber()
  fasilitasId: number;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TujuanDto)
  tujuanList: TujuanDto[];

  @IsNotEmpty()
  @IsDateString()
  tanggalMulai: string; 

  @IsNotEmpty()
  @IsDateString()
  tanggalSelesai: string; 

  @IsOptional()
  @IsString()
  catatanKhusus?: string;
}