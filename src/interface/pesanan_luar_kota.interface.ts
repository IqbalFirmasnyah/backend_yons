export interface PesananLuarKota {
    pesananLuarKotaId: number;
    userId: number;
    paketLuarKotaId: number;
    supirId: number;
    armadaId: number;
    inputTujuanUser?: string;
    tanggalPesan: Date;
    tanggalMulaiWisata: Date;
    tanggalSelesaiWisata: Date;
    jumlahPeserta: number;
    totalHargaFinal: number;
    statusPesanan: string;
    catatanKhusus?: string;
    createdAt: Date;
    updatedAt: Date;
  }