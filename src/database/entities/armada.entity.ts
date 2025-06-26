import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Pesanan } from './pesanan.entity';
import { PesananLuarKota } from 'src/database/entities/pesanan_luar_kota.entity';
import { Booking } from './booking.entity';
import { AssignmentSupirArmada } from 'src/database/entities/assigment_supir_armada.entity';

export enum StatusArmada {
  TERSEDIA = 'tersedia',
  DIGUNAKAN = 'digunakan',
  MAINTENANCE = 'maintenance'
}

@Entity('armada')
export class Armada {
  @PrimaryGeneratedColumn({ name: 'armada_id' })
  armadaId: number;

  @Column({ name: 'jenis_mobil', length: 50 })
  jenisMobil: string;

  @Column({ name: 'merk_mobil', length: 50 })
  merkMobil: string;

  @Column({ name: 'plat_nomor', unique: true, length: 15 })
  platNomor: string;

  @Column()
  kapasitas: number;

  @Column({ name: 'tahun_kendaraan' })
  tahunKendaraan: number;

  @Column({ name: 'status_armada', length: 20 })
  statusArmada: StatusArmada; // Use enum for status

  @Column({ name: 'foto_armada', length: 255, nullable: true })
  fotoArmada: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Pesanan, pesanan => pesanan.armada)
  pesanan: Pesanan[];

  @OneToMany(() => PesananLuarKota, pesananLuarKota => pesananLuarKota.armada)
  pesananLuarKota: PesananLuarKota[];

  @OneToMany(() => AssignmentSupirArmada, assignment => assignment.armada)
  assignmentSupir: AssignmentSupirArmada[];

  @OneToMany(() => Booking, booking => booking.armada)
  booking: Booking[];
}
