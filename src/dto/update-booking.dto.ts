import { PartialType } from '@nestjs/mapped-types'; // Use this for PartialType without Swagger
import { IsOptional, IsInt, IsDateString, Min, IsString, ValidateIf, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBookingDto } from './create_booking.dto';  
import { BookingStatus } from '../services/booking.service'; 

export class UpdateBookingDto extends PartialType(CreateBookingDto) {

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => !o.paketLuarKotaId && !o.fasilitasId)
  paketId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => !o.paketId && !o.fasilitasId)
  paketLuarKotaId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => !o.paketId && !o.paketLuarKotaId)
  fasilitasId?: number;

  @IsOptional()
  @IsDateString()
  tanggalMulaiWisata?: string;

  @IsOptional()
  @IsDateString()
  tanggalSelesaiWisata?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  jumlahPeserta?: number;

  @IsOptional()
  @IsString()
  inputCustomTujuan?: string;

  @IsOptional()
  @IsString()
  catatanKhusus?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  supirId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  armadaId?: number;
    
  @IsOptional()
  @IsEnum(BookingStatus) 
  statusBooking?: BookingStatus;
}