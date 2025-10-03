import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  Min,
  MaxLength,
  IsEnum,
  IsNumber,
  IsJSON,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Assuming you have an enum for StatusPembayaran in your Pembayaran module/DTOs
// You might need to import it if it's external, or redefine if specific to Refund process.
export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export enum RefundMethod {
  TRANSFER_BANK = 'transfer_bank',
  E_WALLET = 'e-wallet',
  CASH = 'cash',
}

export class CreateRefundDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pesananId?: number; // Optional if pesananLuarKotaId or bookingId is provided

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pesananLuarKotaId?: number; // Optional if pesananId or bookingId is provided

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  bookingId?: number; // Optional if pesananId or pesananLuarKotaId is provided

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  pembayaranId: number; // Required: Refund must be associated with a payment

  // userId will typically be derived from the authenticated user, not directly from DTO
  // but included here if client explicitly sends it. If always from auth, remove this field.
  // @IsNotEmpty()
  // @IsInt()
  // @Type(() => Number)
  // userId: number;

  @IsString()
  @IsNotEmpty()
  alasanRefund: string; // Reason for the refund request

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  @IsNotEmpty()
  jumlahRefund: number; // Amount requested by user

  // jumlahPotonganAdmin and jumlahRefundFinal are typically calculated server-side

  @IsEnum(RefundMethod)
  @IsNotEmpty()
  metodeRefund: RefundMethod;

  @ValidateIf((o) => o.metodeRefund !== RefundMethod.CASH)
  @IsString()
  @IsNotEmpty()
  rekeningTujuan: string;

  // statusRefund will be set by the system/admin, defaults to PENDING on creation

  // tanggalPengajuan will be set by the system
  // tanggalDisetujui and tanggalRefundSelesai set by admin actions
  // approvedByAdminId and processedByAdminId set by admin actions
  // buktiRefund is for file upload, not directly in DTO for basic CRUD
  // catatanAdmin is for admin notes
}


