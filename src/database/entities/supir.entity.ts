import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Pesanan } from './pesanan.entity';
import { PesananLuarKota } from 'src/database/entities/pesanan_luar_kota.entity';
import { Booking } from './booking.entity';
import { AssignmentSupirArmada } from 'src/database/entities/assigment_supir_armada.entity';

export enum StatusSupir {
  TERSEDIA = 'tersedia',
  BERTUGAS = 'bertugas',
  OFF = 'off'
}

@Entity('supir')
export class Supir {
  @PrimaryGeneratedColumn({ name: 'supir_id' })
  supirId: number; // Updated to match Prisma schema

  @Column({ name: 'nama' })
  nama: string; // Updated to match Prisma schema

  @Column('text', { name: 'alamat' })
  alamat: string; // Updated to match Prisma schema

  @Column({ name: 'nomor_hp' })
  nomorHp: string; // Updated to match Prisma schema

  @Column({ name: 'nomor_sim' })
  nomorSim: string; // Updated to match Prisma schema

  @Column({ name: 'foto_supir', nullable: true })
  fotoSupir: string; // Updated to match Prisma schema

  @Column({ name: 'pengalaman_tahun', default: 0 })
  pengalamanTahun: number; // Updated to match Prisma schema

  @Column('decimal', { precision: 3, scale: 2, name: 'rating_rata', default: 0 })
  ratingRata: number; // Updated to match Prisma schema

  @Column({
    type: 'enum',
    enum: StatusSupir,
    default: StatusSupir.TERSEDIA,
    name: 'status_supir'
  })
  statusSupir: StatusSupir; // Updated to match Prisma schema

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // Updated to match Prisma schema

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date; // Updated to match Prisma schema

  @OneToMany(() => Pesanan, pesanan => pesanan.supir)
  pesanan: Pesanan[];

  @OneToMany(() => PesananLuarKota, pesananLuarKota => pesananLuarKota.supir)
  pesananLuarKota: PesananLuarKota[]; // Updated to match Prisma schema

  @OneToMany(() => Booking, booking => booking.supir)
  booking: Booking[];

  @OneToMany(() => AssignmentSupirArmada, assignment => assignment.supir)
  assignments: AssignmentSupirArmada[];
}
