export interface Refund {
    refundId: number;
    pesananId?: number;
    pesananLuarKotaId?: number;
    bookingId?: number;
    pembayaranId: number;
    userId: number;
    kodeRefund: string;
    alasanRefund: string;
    jumlahRefund: number;
    jumlahPotonganAdmin: number;
    jumlahRefundFinal: number;
    metodeRefund: string;
    rekeningTujuan?: string;
    statusRefund: string;
    tanggalPengajuan: Date;
    tanggalDisetujui?: Date;
    tanggalRefundSelesai?: Date;
    approvedByAdminId?: number;
    processedByAdminId?: number;
    buktiRefund?: string;
    catatanAdmin?: string;
    createdAt: Date;
    updatedAt: Date;
  }