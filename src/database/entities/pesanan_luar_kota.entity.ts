import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { PaketWisataLuarKota } from 'src/database/entities/paket_wisata_luar.entity';
import { Supir } from './supir.entity';
import { Armada } from './armada.entity';
import { Booking } from './booking.entity';
import { Pembayaran } from './pembayaran.entity';
import { Refund } from './refund.entity';
import { Notifikasi } from 'src/database/entities/notification.entity';
import { StatusPesanan } from './pesanan.entity';

@Entity('pesanan_luar_kota')
export class PesananLuarKota {
  @PrimaryGeneratedColumn({ name: 'pesanan_luar_kota_id' })
  pesananLuarKotaId: number; // Updated to match Prisma schema

  @Column({ name: 'user_id' })
  userId: number; // Updated to match Prisma schema

  @Column({ name: 'paket_luar_kota_id' })
  paketLuarKotaId: number; // Updated to match Prisma schema

  @Column({ name: 'supir_id' })
  supirId: number; // Updated to match Prisma schema

  @Column({ name: 'armada_id' })
  armadaId: number; // Updated to match Prisma schema

  @Column({ name: 'booking_id', nullable: true })
  bookingId: number; // Updated to match Prisma schema

  @Column('text', { name: 'input_tujuan_user', nullable: true })
  inputTujuan: string; // Updated to match Prisma schema

  @Column('date', { name: 'tanggal_pesan' })
  tanggalPesan: Date; // Updated to match Prisma schema

  @Column('date', { name: 'tanggal_mulai_wisata' })
  tanggalMulaiWisata: Date; // Updated to match Prisma schema

  @Column('date', { name: 'tanggal_selesai_wisata' })
  tanggalSelesaiWisata: Date; // Updated to match Prisma schema

  @Column({ name: 'jumlah_peserta' })
  jumlahPeserta: number; // Updated to match Prisma schema

  @Column('decimal', { precision: 12, scale: 2, name: 'total_harga_final' })
  totalHargaFinal: number; // Updated to match Prisma schema

  @Column({
    type: 'enum',
    enum: StatusPesanan,
    default: StatusPesanan.PENDING,
    name: 'status_pesanan'
  })
  statusPesanan: StatusPesanan; // Updated to match Prisma schema

  @Column('text', { name: 'catatan_khusus', nullable: true })
  catatanKhusus: string; // Updated to match Prisma schema

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // Updated to match Prisma schema

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date; // Updated to match Prisma schema

  @ManyToOne(() => User, user => user.pesananLuarKota)
  @JoinColumn({ name: 'user_id' })
  user: User; // Updated to match Prisma schema

  @ManyToOne(() => PaketWisataLuarKota, paket => paket.pesananLuarKota)
  @JoinColumn({ name: 'paket_luar_kota_id' })
  paketLuarKota: PaketWisataLuarKota; // Updated to match Prisma schema

  @ManyToOne(() => Supir, supir => supir.pesananLuarKota)
  @JoinColumn({ name: 'supir_id' })
  supir: Supir; // Updated to match Prisma schema

  @ManyToOne(() => Armada, armada => armada.pesananLuarKota)
  @JoinColumn({ name: 'armada_id' })
  armada: Armada; // Updated to match Prisma schema

  @ManyToOne(() => Booking, booking => booking.pesananLuarKota)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking; // Updated to match Prisma schema

  @OneToMany(() => Pembayaran, pembayaran => pembayaran.pesananLuarKota)
  pembayaran: Pembayaran[]; // Updated to match Prisma schema

  @OneToMany(() => Refund, refund => refund.pesananLuarKota)
  refund: Refund[]; // Updated to match Prisma schema

  @OneToMany(() => Notifikasi, notifikasi => notifikasi.pesananLuarKota)
  notifikasi: Notifikasi[]; // Updated to match Prisma schema
}
