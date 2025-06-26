import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';
import { MetodeRefund } from '../database/entities/refund.entity';

export class CreateRefundDto {
  @IsOptional()
  @IsNumber()
  pesanan_id?: number;

  @IsOptional()
  @IsNumber()
  pesanan_luar_kota_id?: number;

  @IsOptional()
  @IsNumber()
  booking_id?: number;

  @IsNumber()
  pembayaran_id: number;

  @IsString()
  alasan_refund: string;

  @IsNumber()
  jumlah_refund: number;

  @IsEnum(MetodeRefund)
  metode_refund: MetodeRefund;

  @IsOptional()
  @IsString()
  rekening_tujuan?: string;
}