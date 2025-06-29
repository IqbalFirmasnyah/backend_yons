export interface Admin {
    adminId: number;
    username: string;
    email: string;
    password: string;
    namaLengkap: string;
    fotoProfil?: string;
    role: string;
    statusAktif: boolean;
    createdAt: Date;
    updatedAt: Date;
  }