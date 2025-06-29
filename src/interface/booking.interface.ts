export interface Booking {
    bookingId: number;
    userId: number;
    paketId?: number;
    paketLuarKotaId?: number;
    supirId?: number;
    armadaId?: number;
    kodeBooking: string;
    tanggalBooking: Date;
    tanggalMulaiWisata: Date;
    tanggalSelesaiWisata: Date;
    jumlahPeserta: number;
    estimasiHarga: number;
    inputCustomTujuan?: string;
    statusBooking: string;
    catatanKhusus?: string;
    expiredAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }