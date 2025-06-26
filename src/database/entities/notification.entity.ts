import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Admin } from './admin.entity';
import { Pesanan } from './pesanan.entity';
import { PesananLuarKota } from 'src/database/entities/pesanan_luar_kota.entity';
import { Booking } from './booking.entity';
import { Refund } from './refund.entity';

export enum TipeNotifikasi {
  PESANAN_BARU = 'pesanan_baru',
  STATUS_UPDATE = 'status_update',
  PEMBAYARAN = 'pembayaran',
  REFUND = 'refund',
  BOOKING = 'booking'
}

@Entity('notifikasi')
export class Notifikasi {
  @PrimaryGeneratedColumn({ name: 'notifikasi_id' })
  notifikasiId: number; // Updated to match Prisma schema

  @Column({ name: 'user_id', nullable: true })
  userId: number; // Updated to match Prisma schema

  @Column({ name: 'admin_id', nullable: true })
  adminId: number; // Updated to match Prisma schema

  @Column({ name: 'pesanan_id', nullable: true })
  pesananId: number; // Updated to match Prisma schema

  @Column({ name: 'pesanan_luar_kota_id', nullable: true })
  pesananLuarKotaId: number; // Updated to match Prisma schema

  @Column({ name: 'booking_id', nullable: true })
  bookingId: number; // Updated to match Prisma schema

  @Column({ name: 'refund_id', nullable: true })
  refundId: number; // Updated to match Prisma schema

  @Column({
    type: 'enum',
    enum: TipeNotifikasi
  })
  tipeNotifikasi: TipeNotifikasi; // Updated to match Prisma schema

  @Column({ name: 'judul_notifikasi' })
  judulNotifikasi: string; // Updated to match Prisma schema

  @Column('text')
  deskripsi: string; // Updated to match Prisma schema

  @Column({ name: 'is_read', default: false })
  isRead: boolean; // Updated to match Prisma schema

  @Column({ name: 'tanggal_notifikasi', type: 'timestamp' })
  tanggalNotifikasi: Date; // Updated to match Prisma schema

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // Updated to match Prisma schema

  // Relations
  @ManyToOne(() => User, user => user.notifikasi)
  @JoinColumn({ name: 'user_id' }) // Updated to match Prisma schema
  user: User;

  @ManyToOne(() => Admin, admin => admin.notifikasi)
  @JoinColumn({ name: 'admin_id' }) // Updated to match Prisma schema
  admin: Admin;

  @ManyToOne(() => Pesanan, pesanan => pesanan.notifikasi)
  @JoinColumn({ name: 'pesanan_id' }) // Updated to match Prisma schema
  pesanan: Pesanan;

  @ManyToOne(() => PesananLuarKota, pesananLuarKota => pesananLuarKota.notifikasi)
  @JoinColumn({ name: 'pesanan_luar_kota_id' }) // Updated to match Prisma schema
  pesananLuarKota: PesananLuarKota;

  @ManyToOne(() => Booking, booking => booking.notifikasi)
  @JoinColumn({ name: 'booking_id' }) // Updated to match Prisma schema
  booking: Booking;

  @ManyToOne(() => Refund, refund => refund.notifikasi)
  @JoinColumn({ name: 'refund_id' }) // Updated to match Prisma schema
  refund: Refund;
}
