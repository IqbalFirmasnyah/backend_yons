import { IsNumber, IsEnum, IsDate, IsOptional } from 'class-validator';
import { StatusAssignment } from '../database/entities/assigment_supir_armada.entity';

export class UpdateAssignmentSupirArmadaDto {
  @IsOptional()
  @IsNumber()
  supirId?: number;

  @IsOptional()
  @IsNumber()
  armadaId?: number;

  @IsOptional()
  @IsDate()
  tanggalMulaiAssignment?: Date; // Nullable

  @IsOptional()
  @IsDate()
  tanggalSelesaiAssignment?: Date; // Nullable

  @IsOptional()
  @IsEnum(StatusAssignment)
  status?: StatusAssignment; // Use enum for status
}
