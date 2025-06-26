import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Admin } from './admin.entity';
import { Pesanan } from './pesanan.entity';
import { PesananLuarKota } from 'src/database/entities/pesanan_luar_kota.entity';
import { Booking } from './booking.entity';
import { Pembayaran } from './pembayaran.entity';
import { Notifikasi } from 'src/database/entities/notification.entity';

export enum MetodeRefund {
  TRANSFER_BANK = 'transfer_bank',
  E_WALLET = 'e_wallet',
  CASH = 'cash'
}

export enum StatusRefund {
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

@Entity('refund')
export class Refund {
  @PrimaryGeneratedColumn({ name: 'refund_id' })
  refundId: number; // Updated to match Prisma schema

  @Column({ name: 'pesanan_id', nullable: true })
  pesananId: number; // Updated to match Prisma schema

  @Column({ name: 'pesanan_luar_kota_id', nullable: true })
  pesananLuarKotaId: number; // Updated to match Prisma schema

  @Column({ name: 'booking_id', nullable: true })
  bookingId: number; // Updated to match Prisma schema

  @Column({ name: 'pembayaran_id' })
  pembayaranId: number; // Updated to match Prisma schema

  @Column({ name: 'user_id' })
  userId: number; // Updated to match Prisma schema

  @Column({ name: 'kode_refund', unique: true })
  kodeRefund: string; // Updated to match Prisma schema

  @Column('text', { name: 'alasan_refund' })
  alasanRefund: string; // Updated to match Prisma schema

  @Column('decimal', { precision: 12, scale: 2, name: 'jumlah_refund' })
  jumlahRefund: number; // Updated to match Prisma schema

  @Column('decimal', { precision: 12, scale: 2, default: 0, name: 'jumlah_potongan_admin' })
  jumlahPotonganAdmin: number; // Updated to match Prisma schema

  @Column('decimal', { precision: 12, scale: 2, name: 'jumlah_refund_final' })
  jumlahRefundFinal: number; // Updated to match Prisma schema

  @Column({
    type: 'enum',
    enum: MetodeRefund,
    name: 'metode_refund'
  })
  metodeRefund: MetodeRefund; // Updated to match Prisma schema

  @Column('text', { name: 'rekening_tujuan', nullable: true })
  rekeningTujuan: string; // Updated to match Prisma schema

  @Column({
    type: 'enum',
    enum: StatusRefund,
    default: StatusRefund.PENDING,
    name: 'status_refund'
  })
  statusRefund: StatusRefund; // Updated to match Prisma schema

  @Column('timestamp', { name: 'tanggal_pengajuan' })
  tanggalPengajuan: Date; // Updated to match Prisma schema

  @Column('timestamp', { name: 'tanggal_disetujui', nullable: true })
  tanggalDisetujui: Date; // Updated to match Prisma schema

  @Column('timestamp', { name: 'tanggal_refund_selesai', nullable: true })
  tanggalRefundSelesai: Date; // Updated to match Prisma schema

  @Column({ name: 'approved_by_admin_id', nullable: true })
  approvedByAdminId: number; // Updated to match Prisma schema

  @Column({ name: 'processed_by_admin_id', nullable: true })
  processedByAdminId: number; // Updated to match Prisma schema

  @Column({ name: 'bukti_refund', nullable: true })
  buktiRefund: string; // Updated to match Prisma schema

  @Column('text', { name: 'catatan_admin', nullable: true })
  catatanAdmin: string; // Updated to match Prisma schema

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // Updated to match Prisma schema

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date; // Updated to match Prisma schema

  @ManyToOne(() => Pesanan, pesanan => pesanan.refund)
  @JoinColumn({ name: 'pesanan_id' }) // Updated to match Prisma schema
  pesanan: Pesanan;

  @ManyToOne(() => PesananLuarKota, pesananLuarKota => pesananLuarKota.refund)
  @JoinColumn({ name: 'pesanan_luar_kota_id' }) // Updated to match Prisma schema
  pesananLuarKota: PesananLuarKota;

  @ManyToOne(() => Booking, booking => booking.refund)
  @JoinColumn({ name: 'booking_id' }) // Updated to match Prisma schema
  booking: Booking;

  @ManyToOne(() => Pembayaran, pembayaran => pembayaran.refund)
  @JoinColumn({ name: 'pembayaran_id' }) // Updated to match Prisma schema
  pembayaran: Pembayaran;

  @ManyToOne(() => User, user => user.refund)
  @JoinColumn({ name: 'user_id' }) // Updated to match Prisma schema
  user: User;

  @ManyToOne(() => Admin, admin => admin.refundApproved)
  @JoinColumn({ name: 'approved_by_admin_id' }) // Updated to match Prisma schema
  approvedByAdmin: Admin; // Updated to match Prisma schema

  @ManyToOne(() => Admin, admin => admin.refundProcessed)
  @JoinColumn({ name: 'processed_by_admin_id' }) // Updated to match Prisma schema
  processedByAdmin: Admin; // Updated to match Prisma schema

  @OneToMany(() => Notifikasi, notifikasi => notifikasi.refund)
  notifikasi: Notifikasi[];
}
