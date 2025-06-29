export interface PaketWisata {
    paketId: number;
    namaPaket: string;
    namaTempat: string;
    lokasi: string;
    deskripsi: string;
    itinerary: string;
    jarakKm: number;
    durasiHari: number;
    harga: number;
    fotoPaket?: string;
    kategori: string;
    statusPaket: string;
    createdAt: Date;
    updatedAt: Date;
  }