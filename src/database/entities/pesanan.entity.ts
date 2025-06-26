import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { PaketWisata } from 'src/database/entities/paket_wisata.entity';
import { Supir } from './supir.entity';
import { Armada } from './armada.entity';
import { Booking } from './booking.entity';
import { Pembayaran } from './pembayaran.entity';
import { Refund } from './refund.entity';
import { Notifikasi } from 'src/database/entities/notification.entity';

export enum StatusPesanan {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('pesanan')
export class Pesanan {
  @PrimaryGeneratedColumn({ name: 'pesanan_id' })
  pesananId: number; // Updated to match Prisma schema

  @Column({ name: 'user_id' })
  userId: number; // Updated to match Prisma schema

  @Column({ name: 'paket_id' })
  paketId: number; // Updated to match Prisma schema

  @Column({ name: 'supir_id' })
  supirId: number; // Updated to match Prisma schema

  @Column({ name: 'armada_id' })
  armadaId: number; // Updated to match Prisma schema

  @Column({ name: 'booking_id', nullable: true })
  bookingId: number; // Updated to match Prisma schema

  @Column('date', { name: 'tanggal_pesan' })
  tanggalPesan: Date; // Updated to match Prisma schema

  @Column('date', { name: 'tanggal_mulai_wisata' })
  tanggalMulaiWisata: Date; // Updated to match Prisma schema

  @Column('date', { name: 'tanggal_selesai_wisata' })
  tanggalSelesaiWisata: Date; // Updated to match Prisma schema

  @Column({ name: 'jumlah_peserta' })
  jumlahPeserta: number; // Updated to match Prisma schema

  @Column('decimal', { precision: 12, scale: 2, name: 'total_harga' })
  totalHarga: number; // Updated to match Prisma schema

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

  @ManyToOne(() => User, user => user.pesanan)
  @JoinColumn({ name: 'user_id' }) // Updated to match Prisma schema
  user: User;

  @ManyToOne(() => PaketWisata, paket => paket.pesanan)
  @JoinColumn({ name: 'paket_id' }) // Updated to match Prisma schema
  paket: PaketWisata;

  @ManyToOne(() => Supir, supir => supir.pesanan)
  @JoinColumn({ name: 'supir_id' }) // Updated to match Prisma schema
  supir: Supir;

  @ManyToOne(() => Armada, armada => armada.pesanan)
  @JoinColumn({ name: 'armada_id' }) // Updated to match Prisma schema
  armada: Armada;

  @ManyToOne(() => Booking, booking => booking.pesanan)
  @JoinColumn({ name: 'booking_id' }) // Updated to match Prisma schema
  booking: Booking;

  @OneToMany(() => Pembayaran, pembayaran => pembayaran.pesanan)
  pembayaran: Pembayaran[];

  @OneToMany(() => Refund, refund => refund.pesanan)
  refund: Refund[];

  @OneToMany(() => Notifikasi, notifikasi => notifikasi.pesanan)
  notifikasi: Notifikasi[];
}
