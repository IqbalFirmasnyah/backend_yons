import {
    IsNotEmpty, IsNumber, IsOptional, IsEnum, IsString
  } from 'class-validator';
  import { MetodeRefund } from 'src/database/entities/refund.entity'; 
  
  export class CreateRefundDto {
    @IsNotEmpty()
    pembayaranId: number;
  
    @IsNotEmpty()
    userId: number;
  
    @IsOptional()
    pesananId?: number;
  
    @IsOptional()
    pesananLuarKotaId?: number;
  
    @IsOptional()
    bookingId?: number;
  
    @IsNotEmpty()
    @IsString()
    alasanRefund: string;
  
    @IsNotEmpty()
    @IsNumber()
    jumlahRefund: number;
  
    @IsNotEmpty()
    @IsNumber()
    jumlahPotonganAdmin: number;
  
    @IsNotEmpty()
    @IsNumber()
    jumlahRefundFinal: number;
  
    @IsNotEmpty()
    @IsEnum(MetodeRefund)
    metodeRefund: MetodeRefund;
  
    @IsOptional()
    rekeningTujuan?: string;
  
    @IsOptional()
    catatanAdmin?: string;
  }
  