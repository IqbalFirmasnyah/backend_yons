import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';
import { Admin } from './admin.entity';

@Entity('update_status_booking')
export class UpdateStatusBooking {
  @PrimaryGeneratedColumn({ name: 'update_id' })
  updateId: number; // Updated to match Prisma schema

  @Column({ name: 'booking_id' })
  bookingId: number; // Updated to match Prisma schema

  @Column({ name: 'status_lama' })
  statusLama: string; // Updated to match Prisma schema

  @Column({ name: 'status_baru' })
  statusBaru: string; // Updated to match Prisma schema

  @Column({ name: 'updated_by_user_id', nullable: true }) // Fixed the naming issue
  updatedByUser: any; // Fixed the naming issue

  @Column({ name: 'updated_by_admin_id', nullable: true })
  updatedByAdminId: number; // Updated to match Prisma schema

  @Column('timestamp', { name: 'timestamp_update' })
  timestampUpdate: Date; // Updated to match Prisma schema

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // Updated to match Prisma schema

  @ManyToOne(() => Booking, booking => booking.statusUpdates) // Updated to match Prisma schema
  @JoinColumn({ name: 'booking_id' }) // Updated to match Prisma schema
  booking: Booking;

  @ManyToOne(() => User, user => user.updateStatusBookings) // Updated to match Prisma schema
  @JoinColumn({ name: 'updated_by_user_id' }) // Fixed the naming issue
  updatedBy: User; // Updated to match Prisma schema

  @ManyToOne(() => Admin, admin => admin.updateStatusBookings) // Updated to match Prisma schema
  @JoinColumn({ name: 'updated_by_admin_id' }) // Updated to match Prisma schema
  updatedByAdmin: Admin;
}
