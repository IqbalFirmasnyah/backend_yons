export interface AssignmentSupirArmada {
    assignmentId: number;
    supirId: number;
    armadaId: number;
    tanggalMulaiAssignment: Date;
    tanggalSelesaiAssignment?: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }