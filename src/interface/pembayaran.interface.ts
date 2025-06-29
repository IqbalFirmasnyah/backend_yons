export interface Pembayaran {
    pembayaranId: number;
    pesananId?: number;
    pesananLuarKotaId?: number;
    userId: number;
    metodePembayaran: string;
    jumlahBayar: number;
    tanggalPembayaran: Date;
    buktiPembayaran?: string;
    statusPembayaran: string;
    verifiedByAdminId?: number;
    createdAt: Date;
    updatedAt: Date;
  }