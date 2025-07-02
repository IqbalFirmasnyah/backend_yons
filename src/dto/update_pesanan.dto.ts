import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreatePesananDto } from './create_pesanan.dto';

export class UpdatePesananDto extends PartialType(CreatePesananDto) {
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'])
  statusPesanan?: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
}