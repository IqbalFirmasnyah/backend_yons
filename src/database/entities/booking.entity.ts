import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { PaketWisata } from 'src/database/entities/paket_wisata.entity';
import { PaketWisataLuarKota } from 'src/database/entities/paket_wisata_luar.entity';
import { Supir } from './supir.entity';
import { Armada } from './armada.entity';
import { UpdateStatusBooking } from 'src/database/entities/update_status_booking.entity';
import { Refund } from './refund.entity';

export enum StatusBooking {
  DRAFT = 'draft',
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_VERIFIED = 'payment_verified',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

@Entity('booking')
export class Booking {
  @PrimaryGeneratedColumn({ name: 'booking_id' })
  bookingId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'paket_id', nullable: true })
  paketId: number;

  @Column({ name: 'paket_luar_kota_id', nullable: true })
  paketLuarKotaId: number;

  @Column({ name: 'supir_id', nullable: true })
  supirId: number;

  @Column({ name: 'armada_id', nullable: true })
  armadaId: number;

  @Column({ name: 'kode_booking', unique: true, length: 20 })
  kodeBooking: string;

  @Column({ name: 'tanggal_booking', type: 'datetime' })
  tanggalBooking: Date;

  @Column({ name: 'tanggal_mulai_wisata', type: 'datetime' })
  tanggalMulaiWisata: Date;

  @Column({ name: 'tanggal_selesai_wisata', type: 'datetime' })
  tanggalSelesaiWisata: Date;

  @Column({ name: 'jumlah_peserta' })
  jumlahPeserta: number;

  @Column({ name: 'estimasi_harga', type: 'decimal', precision: 12, scale: 2 })
  estimasiHarga: number;

  @Column({ name: 'input_custom_tujuan', type: 'text', nullable: true })
  inputCustomTujuan: string;

  @Column({ name: 'status_booking', length: 30 })
  statusBooking: StatusBooking; // Use enum for status

  @Column({ name: 'catatan_khusus', type: 'text', nullable: true })
  catatanKhusus: string;

  @Column({ name: 'expired_at', type: 'datetime' })
  expiredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.booking)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => PaketWisata, paket => paket.booking, { nullable: true })
  @JoinColumn({ name: 'paket_id' })
  paket: PaketWisata;

  @ManyToOne(() => PaketWisataLuarKota, paketLuarKota => paketLuarKota.booking, { nullable: true })
  @JoinColumn({ name: 'paket_luar_kota_id' })
  paketLuarKota: PaketWisataLuarKota;

  @ManyToOne(() => Supir, supir => supir.booking, { nullable: true })
  @JoinColumn({ name: 'supir_id' })
  supir: Supir;

  @ManyToOne(() => Armada, armada => armada.booking, { nullable: true })
  @JoinColumn({ name: 'armada_id' })
  armada: Armada;

  @OneToMany(() => UpdateStatusBooking, update => update.booking)
  updateStatus: UpdateStatusBooking[];

  @OneToMany(() => Refund, refund => refund.booking)
  refund: Refund[];
  notifikasi: any;
  pesananLuarKota: any;
  pesanan: any;
  statusUpdates: any;
}
