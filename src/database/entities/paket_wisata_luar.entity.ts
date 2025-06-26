import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DetailRuteLuarKota } from 'src/database/entities/detail_rute.entity';
import { PesananLuarKota } from 'src/database/entities/pesanan_luar_kota.entity';
import { Booking } from './booking.entity';
import { StatusPaket } from './paket_wisata.entity';

@Entity('paket_wisata_luar_kota')
export class PaketWisataLuarKota {
  @PrimaryGeneratedColumn({ name: 'paket_luar_kota_id' })
  paketLuarKotaId: number; // Updated to match Prisma schema

  @Column({ name: 'nama_paket' })
  namaPaket: string; // Updated to match Prisma schema

  @Column({ name: 'tujuan_utama' })
  tujuanUtama: string; // Updated to match Prisma schema

  @Column('decimal', { precision: 10, scale: 2, name: 'total_jarak_km' })
  totalJarakKm: number; // Updated to match Prisma schema

  @Column({ name: 'estimasi_durasi' })
  estimasiDurasi: number; // Updated to match Prisma schema

  @Column('decimal', { precision: 12, scale: 2, name: 'harga_estimasi' })
  hargaEstimasi: number; // Updated to match Prisma schema

  @Column({
    type: 'enum',
    enum: StatusPaket,
    default: StatusPaket.AKTIF,
    name: 'status_paket'
  })
  statusPaket: StatusPaket; // Updated to match Prisma schema

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // Updated to match Prisma schema

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date; // Updated to match Prisma schema

  @OneToMany(() => DetailRuteLuarKota, rute => rute.paketLuarKota) // Updated to match Prisma schema
  detailRute: DetailRuteLuarKota[]; // Updated to match Prisma schema

  @OneToMany(() => PesananLuarKota, pesanan => pesanan.paketLuarKota) // Updated to match Prisma schema
  pesananLuarKota: PesananLuarKota[]; // Updated to match Prisma schema

  @OneToMany(() => Booking, booking => booking.paketLuarKota) // Updated to match Prisma schema
  booking: Booking[]; // Updated to match Prisma schema
}
