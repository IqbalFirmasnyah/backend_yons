import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentSupirArmada, StatusAssignment } from '../database/entities/assigment_supir_armada.entity';
import { CreateAssignmentSupirArmadaDto } from '../dto/create_assignment_supir.dto';
import { UpdateAssignmentSupirArmadaDto } from '../dto/update_assignment_supir.dto';
import { Supir } from '../database/entities/supir.entity';
import { Armada } from '../database/entities/armada.entity';

@Injectable()
export class AssignmentSupirArmadaService {
  constructor(
    @InjectRepository(AssignmentSupirArmada)
    private readonly assignmentRepository: Repository<AssignmentSupirArmada>,
    @InjectRepository(Supir)
    private readonly supirRepository: Repository<Supir>,
    @InjectRepository(Armada)
    private readonly armadaRepository: Repository<Armada>,
  ) {}

  async create(createDto: CreateAssignmentSupirArmadaDto): Promise<AssignmentSupirArmada> {
    // Validasi supir dan armada
    const [supir, armada] = await Promise.all([
      this.supirRepository.findOne({ where: { supirId: createDto.supirId } }),
      this.armadaRepository.findOne({ where: { armadaId: createDto.armadaId } }),
    ]);

    if (!supir) {
      throw new NotFoundException(`Supir dengan ID ${createDto.supirId} tidak ditemukan`);
    }

    if (!armada) {
      throw new NotFoundException(`Armada dengan ID ${createDto.armadaId} tidak ditemukan`);
    }

    // Validasi armada tersedia
    if (armada.statusArmada !== 'tersedia') {
      throw new BadRequestException(`Armada tidak tersedia untuk assignment, status: ${armada.statusArmada}`);
    }

    // Validasi status assignment
    if (createDto.status !== StatusAssignment.AKTIF && createDto.tanggalSelesaiAssignment === undefined) {
      throw new BadRequestException('Tanggal selesai harus diisi jika status bukan AKTIF');
    }

    const assignment = this.assignmentRepository.create(createDto);
    return await this.assignmentRepository.save(assignment);
  }

  async findAll(): Promise<AssignmentSupirArmada[]> {
    return await this.assignmentRepository.find({
      relations: ['supir', 'armada'],
    });
  }

  async findOne(id: number): Promise<AssignmentSupirArmada> {
    const assignment = await this.assignmentRepository.findOne({
      where: { assignmentId: id },
      relations: ['supir', 'armada'],
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment dengan ID ${id} tidak ditemukan`);
    }

    return assignment;
  }

  async update(
    id: number,
    updateDto: UpdateAssignmentSupirArmadaDto,
  ): Promise<AssignmentSupirArmada> {
    const assignment = await this.findOne(id);

    // Validasi update sesuai status armada
    if (updateDto.armadaId || updateDto.status) {
      const armada = await this.armadaRepository.findOne({
        where: { armadaId: updateDto.armadaId || assignment.armadaId },
      });

      if (updateDto.status === StatusAssignment.AKTIF && armada?.statusArmada !== 'tersedia') {
        throw new BadRequestException(
          'Armada tidak tersedia untuk assignment aktif',
        );
      }
    }

    Object.assign(assignment, updateDto);
    return await this.assignmentRepository.save(assignment);
  }

  async completeAssignment(id: number): Promise<AssignmentSupirArmada> {
    const assignment = await this.findOne(id);

    if (assignment.status === StatusAssignment.SELESAI) {
      throw new BadRequestException('Assignment sudah selesai');
    }

    assignment.status = StatusAssignment.SELESAI;
    assignment.tanggalSelesaiAssignment = new Date();

    return await this.assignmentRepository.save(assignment);
  }

  async findActiveAssignments(): Promise<AssignmentSupirArmada[]> {
    return await this.assignmentRepository.find({
      where: { status: StatusAssignment.AKTIF },
      relations: ['supir', 'armada'],
    });
  }

  async findAssignmentsByDriver(supirId: number): Promise<AssignmentSupirArmada[]> {
    const supir = await this.supirRepository.findOne({
      where: { supirId },
    });

    if (!supir) {
      throw new NotFoundException(`Supir dengan ID ${supirId} tidak ditemukan`);
    }

    return await this.assignmentRepository.find({
      where: { supirId },
      relations: ['armada'],
    });
  }

  async findAssignmentsByVehicle(armadaId: number): Promise<AssignmentSupirArmada[]> {
    const armada = await this.armadaRepository.findOne({
      where: { armadaId },
    });

    if (!armada) {
      throw new NotFoundException(`Armada dengan ID ${armadaId} tidak ditemukan`);
    }

    return await this.assignmentRepository.find({
      where: { armadaId },
      relations: ['supir'],
    });
  }
}
