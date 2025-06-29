export interface DetailRuteLuarKota {
    ruteId: number;
    paketLuarKotaId: number;
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