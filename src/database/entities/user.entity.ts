import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Pesanan } from './pesanan.entity';
import { PesananLuarKota } from 'src/database/entities/pesanan_luar_kota.entity';
import { Booking } from './booking.entity';
import { Pembayaran } from './pembayaran.entity';
import { Refund } from './refund.entity';
import { Notifikasi } from 'src/database/entities/notification.entity';
import { UpdateStatusBooking } from './update_status_booking.entity'; // Import the UpdateStatusBooking entity

@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number; // Updated to match Prisma schema

  @Column({ unique: true })
  username: string; // Updated to match Prisma schema

  @Column({ unique: true })
  email: string; // Updated to match Prisma schema

  @Column()
  password: string; // Updated to match Prisma schema

  @Column({ name: 'nama_lengkap' })
  namaLengkap: string; // Updated to match Prisma schema

  @Column('text')
  alamat: string; // Updated to match Prisma schema

  @Column('date', { name: 'tanggal_lahir' })
  tanggalLahir: Date; // Updated to match Prisma schema

  @Column({ name: 'no_hp' })
  noHp: string; // Updated to match Prisma schema

  @Column({ name: 'foto_profil', nullable: true })
  fotoProfil: string; // Updated to match Prisma schema

  @Column({ name: 'status_aktif', default: true })
  statusAktif: boolean; // Updated to match Prisma schema

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // Updated to match Prisma schema

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date; // Updated to match Prisma schema

  @OneToMany(() => Pesanan, pesanan => pesanan.user)
  pesanan: Pesanan[];

  @OneToMany(() => PesananLuarKota, pesananLuarKota => pesananLuarKota.user)
  pesananLuarKota: PesananLuarKota[];

  @OneToMany(() => Booking, booking => booking.user)
  booking: Booking[];

  @OneToMany(() => Pembayaran, pembayaran => pembayaran.user)
  pembayaran: Pembayaran[];

  @OneToMany(() => Refund, refund => refund.user)
  refund: Refund[];

  @OneToMany(() => Notifikasi, notifikasi => notifikasi.user)
  notifikasi: Notifikasi[];

  @OneToMany(() => UpdateStatusBooking, updateStatusBooking => updateStatusBooking.updatedBy) // Updated to match Prisma schema
  updateStatusBookings: UpdateStatusBooking[]; // Updated to match Prisma schema
}
