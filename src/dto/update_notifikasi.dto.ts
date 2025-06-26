import { IsOptional, IsEnum, IsString, IsDate } from 'class-validator';
import { TipeNotifikasi } from '../database/entities/notification.entity';

export class UpdateNotifikasiDto {
  @IsOptional()
  userId?: number;

  @IsOptional()
  adminId?: number;

  @IsOptional()
  pesananId?: number;

  @IsOptional()
  pesananLuarKotaId?: number;

  @IsOptional()
  bookingId?: number;

  @IsOptional()
  refundId?: number;

  @IsOptional()
  @IsEnum(TipeNotifikasi)
  tipeNotifikasi?: TipeNotifikasi;

  @IsOptional()
  @IsString()
  judulNotifikasi?: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;

  @IsOptional()
  @IsDate()
  tanggalNotifikasi?: Date;

  @IsOptional()
  isRead?: boolean;
}
