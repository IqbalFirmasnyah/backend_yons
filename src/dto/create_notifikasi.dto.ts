import {
    IsString,
    IsEnum,
    IsOptional,
    IsDate,
    IsInt,
    IsBoolean,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { TipeNotifikasi } from '../database/entities/notification.entity';
  
  export class CreateNotifikasiDto {
    @IsOptional()
    @IsInt()
    userId?: number;
  
    @IsOptional()
    @IsInt()
    adminId?: number;
  
    @IsOptional()
    @IsInt()
    pesananId?: number;
  
    @IsOptional()
    @IsInt()
    pesananLuarKotaId?: number;
  
    @IsOptional()
    @IsInt()
    bookingId?: number;
  
    @IsOptional()
    @IsInt()
    refundId?: number;
  
    @IsEnum(TipeNotifikasi)
    tipeNotifikasi: TipeNotifikasi;
  
    @IsString()
    judulNotifikasi: string;
  
    @IsString()
    deskripsi: string;
  
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    tanggalNotifikasi?: Date;
  
    @IsOptional()
    @IsBoolean()
    isRead?: boolean;
  }
  