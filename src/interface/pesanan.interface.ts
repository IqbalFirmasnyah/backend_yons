export interface Pesanan {
    pesananId: number;
    userId: number;
    paketId: number;
    supirId: number;
    armadaId: number;
    tanggalPesan: Date;
    tanggalMulaiWisata: Date;
    tanggalSelesaiWisata: Date;
    jumlahPeserta: number;
    totalHarga: number;
    statusPesanan: string;
    catatanKhusus?: string;
    createdAt: Date;
    updatedAt: Date;
  }