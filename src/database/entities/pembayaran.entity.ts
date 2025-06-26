import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Admin } from './admin.entity';
import { Pesanan } from './pesanan.entity';
import { PesananLuarKota } from 'src/database/entities/pesanan_luar_kota.entity';
import { Refund } from './refund.entity';

export enum MetodePembayaran {
  TRANSFER = 'transfer',
  CASH = 'cash',
  E_WALLET = 'e-wallet'
}

export enum StatusPembayaran {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

@Entity('pembayaran')
export class Pembayaran {
  @PrimaryGeneratedColumn({ name: 'pembayaran_id' })
  pembayaranId: number; // Updated to match Prisma schema

  @Column({ name: 'pesanan_id', nullable: true })
  pesananId: number; // Updated to match Prisma schema

  @Column({ name: 'pesanan_luar_kota_id', nullable: true })
  pesananLuarKotaId: number; // Updated to match Prisma schema

  @Column({ name: 'user_id' })
  userId: number; // Updated to match Prisma schema

  @Column({
    type: 'enum',
    enum: MetodePembayaran,
    name: 'metode_pembayaran'
  })
  metodePembayaran: MetodePembayaran; // Updated to match Prisma schema

  @Column('decimal', { precision: 12, scale: 2, name: 'jumlah_bayar' })
  jumlahBayar: number; // Updated to match Prisma schema

  @Column('timestamp', { name: 'tanggal_pembayaran' })
  tanggalPembayaran: Date; // Updated to match Prisma schema

  @Column({ name: 'bukti_pembayaran', nullable: true })
  buktiPembayaran: string; // Updated to match Prisma schema

  @Column({
    type: 'enum',
    enum: StatusPembayaran,
    default: StatusPembayaran.PENDING,
    name: 'status_pembayaran'
  })
  statusPembayaran: StatusPembayaran; // Updated to match Prisma schema

  @Column({ name: 'verified_by_admin_id', nullable: true })
  verifiedByAdminId: number; // Updated to match Prisma schema

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // Updated to match Prisma schema

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date; // Updated to match Prisma schema

  @ManyToOne(() => Pesanan, pesanan => pesanan.pembayaran)
  @JoinColumn({ name: 'pesanan_id' }) // Updated to match Prisma schema
  pesanan: Pesanan;

  @ManyToOne(() => PesananLuarKota, pesananLuarKota => pesananLuarKota.pembayaran)
  @JoinColumn({ name: 'pesanan_luar_kota_id' }) // Updated to match Prisma schema
  pesananLuarKota: PesananLuarKota;

  @ManyToOne(() => User, user => user.pembayaran)
  @JoinColumn({ name: 'user_id' }) // Updated to match Prisma schema
  user: User;

  @ManyToOne(() => Admin, admin => admin.pembayaranVerified)
  @JoinColumn({ name: 'verified_by_admin_id' }) // Updated to match Prisma schema
  verifiedByAdmin: Admin;

  @OneToMany(() => Refund, refund => refund.pembayaran)
  refund: Refund[];
}
