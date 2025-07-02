import { PartialType } from '@nestjs/mapped-types';
import { CreateRefundDto } from './create_refund.dto'; 
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusRefund } from 'src/database/entities/refund.entity'; 

export class UpdateRefundDto extends PartialType(CreateRefundDto) {
  @IsOptional()
  @IsEnum(StatusRefund)
  statusRefund?: StatusRefund;

  @IsOptional()
  approvedByAdminId?: number;

  @IsOptional()
  processedByAdminId?: number;

  @IsOptional()
  @IsString()
  buktiRefund?: string;
}
