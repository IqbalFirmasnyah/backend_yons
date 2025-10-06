export class PesananResponseDto {
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
  
    // Relations
    user?: {
      userId: number;
      username: string;
      namaLengkap: string;
      email: string;
    };
    paket?: {
      paketId: number;
      namaPaket: string;
      namaTempat: string;
      lokasi: string;
      harga: number;
    };
    supir?: {
      supirId: number;
      nama: string;
      nomorHp: string;
      ratingRata: number | null;
    };
    armada?: {
      armadaId: number;
      jenisMobil: string;
      merkMobil: string;
      platNomor: string;
      kapasitas: number;
    };
  }