import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Pesanan } from './pesanan.entity';
import { Booking } from './booking.entity';

export enum KategoriPaket {
  DALAM_KOTA = 'dalam_kota',
  LUAR_KOTA = 'luar_kota'
}

export enum StatusPaket {
  AKTIF = 'aktif',
  NON_AKTIF = 'non_aktif'
}

@Entity('paket_wisata')
export class PaketWisata {
  @PrimaryGeneratedColumn({ name: 'paket_id' })
  paketId: number; // Updated to match Prisma schema

  @Column({ name: 'nama_paket' })
  namaPaket: string; // Updated to match Prisma schema

  @Column({ name: 'nama_tempat' })
  namaTempat: string; // Updated to match Prisma schema

  @Column('text')
  lokasi: string;

  @Column('text')
  deskripsi: string;

  @Column('text')
  itinerary: string;

  @Column('decimal', { precision: 10, scale: 2, name: 'jarak_km' })
  jarakKm: number; // Updated to match Prisma schema

  @Column({ name: 'durasi_hari' })
  durasiHari: number; // Updated to match Prisma schema

  @Column('decimal', { precision: 12, scale: 2 })
  harga: number;

  @Column({ name: 'foto_paket', nullable: true })
  fotoPaket: string; // Updated to match Prisma schema

  @Column({
    type: 'enum',
    enum: KategoriPaket,
    name: 'kategori'
  })
  kategori: KategoriPaket;

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

  @OneToMany(() => Pesanan, pesanan => pesanan.paket)
  pesanan: Pesanan[];

  @OneToMany(() => Booking, booking => booking.paket)
  booking: Booking[];
}
