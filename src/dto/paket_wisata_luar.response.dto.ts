export class DetailRuteResponseDto {
    ruteId: number;
    urutanKe: number;
    namaDestinasi: string;
    alamatDestinasi: string;
    jarakDariSebelumnyaKm: number;
    estimasiWaktuTempuh: number;
    waktuKunjunganMenit: number;
    deskripsiSingkat?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export class PaketWisataLuarKotaResponseDto {
    paketLuarKotaId: number;
    namaPaket: string;
    tujuanUtama: string;
    totalJarakKm: number;
    estimasiDurasi: number;
    hargaEstimasi: number;
    statusPaket: string;
    createdAt: Date;
    updatedAt: Date;
    detailRute: DetailRuteResponseDto[];
  }