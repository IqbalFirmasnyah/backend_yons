// src/pembayaran/dto/create-pembayaran.dto.ts
import { IsNumber, IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export class CreatePembayaranDto {
  @IsOptional()
  pesananId?: number;

  @IsOptional()
  bookingId?: number;

  @IsOptional()
  pesananLuarKotaId?: number;

  @IsNumber()
  userId: number;

  @IsString()
  metodePembayaran: string; // e.g., 'transfer', 'cash', 'e-wallet'

  @IsNumber()
  jumlahBayar: number;

  @IsDateString()
  tanggalPembayaran: string;

  @IsOptional()
  @IsString()
  buktiPembayaran?: string;

  @IsString()
  statusPembayaran: string; // e.g., 'pending', 'verified', 'rejected'

  @IsOptional()
  verifiedByAdminId?: number;
}
