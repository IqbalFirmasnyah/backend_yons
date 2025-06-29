export interface Armada {
    armadaId: number;
    jenisMobil: string;
    merkMobil: string;
    platNomor: string;
    kapasitas: number;
    tahunKendaraan: number;
    statusArmada: string;
    fotoArmada?: string;
    createdAt: Date;
    updatedAt: Date;
  }