import { IsString, IsEnum, IsOptional, IsDate } from 'class-validator';
import { TipeNotifikasi } from '../database/entities/notification.entity';

export class CreateNotifikasiDto {
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

  @IsEnum(TipeNotifikasi)
  tipeNotifikasi: TipeNotifikasi;

  @IsString()
  judulNotifikasi: string;

  @IsString()
  deskripsi: string;

  @IsOptional()
  @IsDate()
  tanggalNotifikasi?: Date;

  @IsOptional()
  isRead?: boolean;
}
