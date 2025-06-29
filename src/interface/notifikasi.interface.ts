export interface Notifikasi {
    notifikasiId: number;
    userId?: number;
    adminId?: number;
    pesananId?: number;
    pesananLuarKotaId?: number;
    tipeNotifikasi: string;
    judulNotifikasi: string;
    deskripsi: string;
    isRead: boolean;
    tanggalNotifikasi: Date;
    createdAt: Date;
  }