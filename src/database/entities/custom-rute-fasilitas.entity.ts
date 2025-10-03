// // src/custom-rute-fasilitas/entities/custom-rute-fasilitas.entity.ts
// import { CustomRuteFasilitas as PrismaCustomRuteFasilitas } from '@prisma/client';
// import { ApiProperty } from '@nestjs/swagger';

// export class CustomRuteFasilitasEntity implements PrismaCustomRuteFasilitas {
//   @ApiProperty({ description: 'ID unik rute custom' })
//   customRuteId: number;

//   @ApiProperty({ description: 'ID fasilitas yang terkait' })
//   fasilitasId: number;

//   @ApiProperty({ description: 'Daftar tujuan dalam format JSON string' })
//   tujuanList: string;

//   @ApiProperty({ description: 'Total jarak rute dalam KM' })
//   totalJarakKm: number;

//   @ApiProperty({ description: 'Estimasi durasi rute dalam menit' })
//   estimasiDurasi: number;

//   @ApiProperty({ description: 'Harga estimasi untuk rute ini' })
//   hargaEstimasi: number; // Decimal dari Prisma akan dikonversi ke Number di sini

//   @ApiProperty({ required: false, description: 'Catatan khusus' })
//   catatanKhusus: string | null;

//   @ApiProperty({ description: 'Tanggal pembuatan' })
//   createdAt: Date;

//   @ApiProperty({ description: 'Tanggal terakhir diperbarui' })
//   updatedAt: Date;

//   constructor(customRute: Partial<PrismaCustomRuteFasilitas>) {
//     Object.assign(this, customRute);
//     if (customRute.hargaEstimasi !== undefined) {
//       this.hargaEstimasi = parseFloat(customRute.hargaEstimasi.toString());
//     }
//   }
// }