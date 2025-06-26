import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Pembayaran } from './pembayaran.entity';
import { Refund } from './refund.entity';
import { UpdateStatusBooking } from 'src/database/entities/update_status_booking.entity';
import { Notifikasi } from 'src/database/entities/notification.entity';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin'
}

@Entity('admin')
export class Admin {
  @PrimaryGeneratedColumn({ name: 'admin_id' })
  adminId: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ name: 'nama_lengkap', length: 100 })
  namaLengkap: string;

  @Column({ name: 'foto_profil', length: 255, nullable: true })
  fotoProfil: string;

  @Column({ length: 20 })
  role: AdminRole; // Use enum for role

  @Column({ name: 'status_aktif', default: true })
  statusAktif: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Notifikasi, notifikasi => notifikasi.admin)
  notifikasi: Notifikasi[];

  @OneToMany(() => Pembayaran, pembayaran => pembayaran.verifiedByAdmin)
  pembayaranVerified: Pembayaran[];

  @OneToMany(() => Refund, refund => refund.approvedByAdmin)
  refundApproved: Refund[];

  @OneToMany(() => Refund, refund => refund.processedByAdmin)
  refundProcessed: Refund[];

  @OneToMany(() => UpdateStatusBooking, update => update.updatedByAdmin)
  updateStatusAdmin: UpdateStatusBooking[];
  updateStatusBookings: any;
}
