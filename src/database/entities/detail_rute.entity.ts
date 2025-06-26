import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PaketWisataLuarKota } from 'src/database/entities/paket_wisata_luar.entity';

@Entity('detail_rute_luar_kota')
export class DetailRuteLuarKota {
  @PrimaryGeneratedColumn({ name: 'rute_id' })
  ruteId: number;

  @Column({ name: 'paket_luar_kota_id' })
  paketLuarKotaId: number;

  @Column({ name: 'urutan_ke' })
  urutanKe: number;

  @Column({ name: 'nama_destinasi', length: 100 })
  namaDestinasi: string;

  @Column({ name: 'alamat_destinasi', type: 'text' })
  alamatDestinasi: string;

  @Column({ name: 'jarak_dari_sebelumnya_km' })
  jarakDariSebelumnyaKm: number;

  @Column({ name: 'estimasi_waktu_tempuh' })
  estimasiWaktuTempuh: number; // dalam menit

  @Column({ name: 'waktu_kunjungan_menit' })
  waktuKunjunganMenit: number;

  @Column({ name: 'deskripsi_singkat', type: 'text', nullable: true })
  deskripsiSingkat: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PaketWisataLuarKota, paketLuarKota => paketLuarKota.detailRute)
  @JoinColumn({ name: 'paket_luar_kota_id' })
  paketLuarKota: PaketWisataLuarKota;
}
