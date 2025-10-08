import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsInt,
    IsDecimal,
    IsIn,
  } from 'class-validator';
  
  export class CreateSupirDto {
    @IsString()
    @IsNotEmpty()
    nama: string;
  
    @IsString()
    @IsNotEmpty()
    alamat: string;
  
    @IsString()
    @IsNotEmpty()
    nomorHp: string;
  
    @IsString()
    @IsNotEmpty()
    nomorSim: string;
  
    @IsOptional()
    @IsString()
    fotoSupir?: string;
  
    @IsInt()
    pengalamanTahun: number;
  
    @IsString()
    @IsIn(['tersedia', 'bertugas', 'off'])
    statusSupir: string;
  }
  