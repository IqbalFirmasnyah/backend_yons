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
  
    @IsOptional()
    @IsDecimal({ decimal_digits: '0,2' }, { message: 'Format harus angka desimal, contoh: 4.5' })
    ratingRata?: any;
  
    @IsString()
    @IsIn(['tersedia', 'bertugas', 'off'])
    statusSupir: string;
  }
  