// dto/booking.dto.ts
import { IsNotEmpty, IsOptional, IsInt, IsDateString, IsString, IsEnum, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum BookingStatus {
  DRAFT = 'draft',
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_VERIFIED = 'payment_verified',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export class CreateBookingDto {
  @ApiProperty({ description: 'User ID who makes the booking' })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  userId: number;

  @ApiPropertyOptional({ description: 'Package ID for in-city tour' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => !o.paketLuarKotaId)
  paketId?: number;

  @ApiPropertyOptional({ description: 'Package ID for out-of-city tour' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o) => !o.paketId)
  paketLuarKotaId?: number;

  @ApiProperty({ description: 'Tour start date', example: '2024-12-25T08:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  tanggalMulaiWisata: string;

  @ApiProperty({ description: 'Tour end date', example: '2024-12-26T18:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  tanggalSelesaiWisata: string;

  @ApiProperty({ description: 'Number of participants', minimum: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  jumlahPeserta: number;

  @ApiPropertyOptional({ description: 'Custom destination input for flexible tours' })
  @IsOptional()
  @IsString()
  inputCustomTujuan?: string;

  @ApiPropertyOptional({ description: 'Special notes or requests' })
  @IsOptional()
  @IsString()
  catatanKhusus?: string;
}

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @ApiPropertyOptional({ description: 'Driver ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  supirId?: number;

  @ApiPropertyOptional({ description: 'Vehicle ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  armadaId?: number;

  @ApiPropertyOptional({ description: 'Booking status', enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  statusBooking?: BookingStatus;

  @ApiPropertyOptional({ description: 'Estimated price' })
  @IsOptional()
  @Type(() => Number)
  estimasiHarga?: number;
}

export class AssignResourcesDto {
  @ApiProperty({ description: 'Driver ID to assign' })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  supirId: number;

  @ApiProperty({ description: 'Vehicle ID to assign' })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  armadaId: number;
}

export class BookingQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by status', enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;
}