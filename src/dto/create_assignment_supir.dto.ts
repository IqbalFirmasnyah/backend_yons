// src/assignment-supir-armada/dto/create-assignment.dto.ts
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAssignmentDto {
  @IsInt()
  supirId: number;

  @IsInt()
  armadaId: number;

  @IsDateString()
  tanggalMulaiAssignment: string;

  @IsOptional()
  @IsDateString()
  tanggalSelesaiAssignment?: string;

  @IsString()
  status: string; // 'aktif', 'selesai'
}
