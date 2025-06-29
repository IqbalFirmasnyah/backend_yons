
export interface Supir {
    supirId: number;
    nama: string;
    alamat: string;
    nomorHp: string;
    nomorSim: string;
    fotoSupir?: string;
    pengalamanTahun: number;
    ratingRata?: number;
    statusSupir: string;
    createdAt: Date;
    updatedAt: Date;
  }