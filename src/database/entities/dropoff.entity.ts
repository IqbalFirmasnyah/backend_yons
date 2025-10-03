// // src/dropoff/entities/dropoff.entity.ts
// import { Dropoff as PrismaDropoff } from '@prisma/client';
// import { ApiProperty } from '@nestjs/swagger';

// export class DropoffEntity implements PrismaDropoff {
//   @ApiProperty({ description: 'ID unik dropoff' })
//   dropoffId: number;

//   @ApiProperty({ description: 'ID fasilitas yang terkait' })
//   fasilitasId: number;

//   @ApiProperty({ description: 'Nama tujuan dropoff' })
//   namaTujuan: string;

//   @ApiProperty({ description: 'Alamat lengkap tujuan dropoff' })
//   alamatTujuan: string;

//   @ApiProperty({ description: 'Jarak ke tujuan dalam KM' })
//   jarakKm: number;

//   @ApiProperty({ description: 'Estimasi durasi perjalanan dalam menit' })
//   estimasiDurasi: number;

//   @ApiProperty({ description: 'Harga estimasi untuk dropoff ini' })
//   hargaEstimasi: number; // Decimal dari Prisma akan dikonversi ke Number di sini

//   @ApiProperty({ description: 'Tanggal pembuatan' })
//   createdAt: Date;

//   @ApiProperty({ description: 'Tanggal terakhir diperbarui' })
//   updatedAt: Date;

//   constructor(dropoff: Partial<PrismaDropoff>) {
//     Object.assign(this, dropoff);
//     if (dropoff.hargaEstimasi !== undefined) {
//       this.hargaEstimasi = parseFloat(dropoff.hargaEstimasi.toString());
//     }
//   }
// }