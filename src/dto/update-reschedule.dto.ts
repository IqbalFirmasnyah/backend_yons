import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateRescheduleDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  catatanAdmin?: string;
}