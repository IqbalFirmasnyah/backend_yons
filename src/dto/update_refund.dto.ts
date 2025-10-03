import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsInt, IsDateString, IsNumber, Min, IsEnum, MaxLength, IsJSON } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRefundDto, RefundStatus, RefundMethod } from './create_refund.dto';

export class UpdateRefundDto extends PartialType(CreateRefundDto) {
  // All fields from CreateRefundDto are made optional by PartialType.
  // We'll explicitly add validation for admin-specific fields or status updates.

  @IsOptional()
  @IsEnum(RefundStatus)
  statusRefund?: RefundStatus; // Status updated by admin

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  jumlahPotonganAdmin?: number; // Admin's discretion for deductions

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  jumlahRefundFinal?: number; // Final calculated refund amount

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  approvedByAdminId?: number; // ID of admin who approved

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  processedByAdminId?: number; // ID of admin who processed

  @IsOptional()
  @IsString()
  buktiRefund?: string; // URL or path to proof of refund

  @IsOptional()
  @IsString()
  catatanAdmin?: string; // Admin's internal notes

  @IsOptional()
  @IsDateString()
  tanggalDisetujui?: string;

  @IsOptional()
  @IsDateString()
  tanggalRefundSelesai?: string;
}