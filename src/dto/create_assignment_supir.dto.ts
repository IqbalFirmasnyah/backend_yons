import { IsNumber, IsEnum, IsDate, IsOptional } from 'class-validator';
import { StatusAssignment } from '../database/entities/assigment_supir_armada.entity';

export class CreateAssignmentSupirArmadaDto {
  @IsNumber()
  supirId: number;

  @IsNumber()
  armadaId: number;

  @IsDate()
  tanggalMulaiAssignment: Date;

  @IsOptional()
  @IsDate()
  tanggalSelesaiAssignment?: Date; // Nullable

  @IsEnum(StatusAssignment)
  status: StatusAssignment; // Use enum for status
}
