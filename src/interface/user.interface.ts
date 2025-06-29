export interface User {
    userId: number;
    username: string;
    email: string;
    password: string;
    namaLengkap: string;
    alamat: string;
    tanggalLahir: Date;
    noHp: string;
    fotoProfil?: string;
    statusAktif: boolean;
    createdAt: Date;
    updatedAt: Date;
  }