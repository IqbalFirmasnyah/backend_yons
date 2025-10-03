// // src/fasilitas/entities/fasilitas.entity.ts
// import { Fasilitas as PrismaFasilitas, Dropoff, CustomRuteFasilitas, PaketWisataLuarKota as PrismaPaketWisataLuarKotaModel } from '@prisma/client';
// import { ApiProperty } from '@nestjs/swagger';
// import { DropoffEntity } from '../../dropoff/entities/dropoff.entity'; // Pastikan path ini benar
// import { CustomRuteFasilitasEntity } from '../../custom-rute-fasilitas/entities/custom-rute-fasilitas.entity'; // Pastikan path ini benar
// import { PaketWisataLuarKotaEntity } from '../../paket-wisata-luar-kota/entities/paket-wisata-luar-kota.entity'; // Path yang benar ke entity Prisma-based Anda

// export class FasilitasEntity implements PrismaFasilitas {
//   @ApiProperty({ description: 'ID unik fasilitas' })
//   fasilitasId: number;

//   @ApiProperty({ description: 'Jenis fasilitas: dropoff, custom, atau paket_luar_kota' })
//   jenisFasilitas: string;

//   @ApiProperty({ description: 'Nama fasilitas, misal: "Dropoff Bandara", "Rute Wisata Yogyakarta"' })
//   namaFasilitas: string;

//   @ApiProperty({ required: false, description: 'Deskripsi detail fasilitas' })
//   deskripsi: string | null;

//   @ApiProperty({ description: 'Tanggal pembuatan fasilitas' })
//   createdAt: Date;

//   @ApiProperty({ description: 'Tanggal terakhir diperbarui' })
//   updatedAt: Date;

//   @ApiProperty({ required: false, description: 'ID Paket Wisata Luar Kota jika jenis fasilitas adalah paket_luar_kota' })
//   paketLuarKotaId: number | null;

//   @ApiProperty({ required: false, type: () => DropoffEntity })
//   dropoff?: DropoffEntity;

//   @ApiProperty({ required: false, type: () => CustomRuteFasilitasEntity })
//   customRute?: CustomRuteFasilitasEntity;

//   @ApiProperty({ required: false, type: () => PaketWisataLuarKotaEntity })
//   paketLuarKota?: PaketWisataLuarKotaEntity;


//   constructor(fasilitas: Partial<PrismaFasilitas & { dropoff?: Dropoff, customRute?: CustomRuteFasilitas, paketLuarKota?: PrismaPaketWisataLuarKotaModel }>) {
//     Object.assign(this, fasilitas);
//     if (fasilitas.dropoff) {
//         this.dropoff = new DropoffEntity(fasilitas.dropoff);
//     }
//     if (fasilitas.customRute) {
//         this.customRute = new CustomRuteFasilitasEntity(fasilitas.customRute);
//     }
//     // Konversi PaketWisataLuarKota dari Prisma model ke Entity
//     if (fasilitas.paketLuarKota) {
//         this.paketLuarKota = new PaketWisataLuarKotaEntity(fasilitas.paketLuarKota);
//     }
//   }
// }