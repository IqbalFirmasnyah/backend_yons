import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Supir } from './supir.entity';
import { Armada } from './armada.entity';

export enum StatusAssignment {
  AKTIF = 'aktif',
  SELESAI = 'selesai'
}

@Entity('assignment_supir_armada')
export class AssignmentSupirArmada {
  @PrimaryGeneratedColumn({ name: 'assignment_id' })
  assignmentId: number;

  @Column({ name: 'supir_id' })
  supirId: number;

  @Column({ name: 'armada_id' })
  armadaId: number;

  @Column({ name: 'tanggal_mulai_assignment', type: 'datetime' })
  tanggalMulaiAssignment: Date;

  @Column({ name: 'tanggal_selesai_assignment', type: 'datetime', nullable: true })
  tanggalSelesaiAssignment: Date;

  @Column({ length: 20 })
  status: StatusAssignment; // Use enum for status

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Supir, supir => supir.assignments)
  @JoinColumn({ name: 'supir_id' })
  supir: Supir;

  @ManyToOne(() => Armada, armada => armada.assignmentSupir)
  @JoinColumn({ name: 'armada_id' })
  armada: Armada;
}
