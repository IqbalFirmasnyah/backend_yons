import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAssignmentDto } from '../dto/create_assignment_supir.dto';
import { UpdateAssignmentDto } from 'src/dto/update_assignment_supir.dto'; 
import { StatusAssignment } from 'src/database/entities/assigment_supir_armada.entity';  

@Injectable()
export class AssignmentSupirArmadaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssignmentDto) {
    const [supir, armada] = await Promise.all([
      this.prisma.supir.findUnique({ where: { supirId: dto.supirId } }),
      this.prisma.armada.findUnique({ where: { armadaId: dto.armadaId } }),
    ]);

    if (!supir) {
      throw new NotFoundException(`Supir dengan ID ${dto.supirId} tidak ditemukan`);
    }

    if (!armada) {
      throw new NotFoundException(`Armada dengan ID ${dto.armadaId} tidak ditemukan`);
    }

    if (armada.statusArmada !== 'tersedia') {
      throw new BadRequestException(`Armada tidak tersedia untuk assignment, status: ${armada.statusArmada}`);
    }

    if (dto.status !== StatusAssignment.AKTIF && !dto.tanggalSelesaiAssignment) {
      throw new BadRequestException('Tanggal selesai harus diisi jika status bukan AKTIF');
    }

    return this.prisma.assignmentSupirArmada.create({
      data: {
        ...dto,
        tanggalMulaiAssignment: new Date(dto.tanggalMulaiAssignment),
        tanggalSelesaiAssignment: dto.tanggalSelesaiAssignment ? new Date(dto.tanggalSelesaiAssignment) : null,
      },
    });
  }

  async findAll() {
    return this.prisma.assignmentSupirArmada.findMany({
      include: {
        supir: true,
        armada: true,
      },
    });
  }

  async findOne(id: number) {
    const assignment = await this.prisma.assignmentSupirArmada.findUnique({
      where: { assignmentId: id },
      include: {
        supir: true,
        armada: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment dengan ID ${id} tidak ditemukan`);
    }

    return assignment;
  }

  async update(id: number, dto: UpdateAssignmentDto) {
    const existing = await this.findOne(id);

    if (dto.armadaId || dto.status) {
      const armadaIdToCheck = dto.armadaId || existing.armadaId;
      const armada = await this.prisma.armada.findUnique({ where: { armadaId: armadaIdToCheck } });

      if (!armada) throw new NotFoundException(`Armada dengan ID ${armadaIdToCheck} tidak ditemukan`);

      if (dto.status === StatusAssignment.AKTIF && armada.statusArmada !== 'tersedia') {
        throw new BadRequestException('Armada tidak tersedia untuk assignment aktif');
      }
    }

    return this.prisma.assignmentSupirArmada.update({
      where: { assignmentId: id },
      data: {
        ...dto,
        tanggalMulaiAssignment: dto.tanggalMulaiAssignment
          ? new Date(dto.tanggalMulaiAssignment)
          : undefined,
        tanggalSelesaiAssignment: dto.tanggalSelesaiAssignment
          ? new Date(dto.tanggalSelesaiAssignment)
          : undefined,
      },
    });
  }

  async completeAssignment(id: number) {
    const assignment = await this.findOne(id);

    if (assignment.status === StatusAssignment.SELESAI) {
      throw new BadRequestException('Assignment sudah selesai');
    }

    return this.prisma.assignmentSupirArmada.update({
      where: { assignmentId: id },
      data: {
        status: StatusAssignment.SELESAI,
        tanggalSelesaiAssignment: new Date(),
      },
    });
  }

  async findActiveAssignments() {
    return this.prisma.assignmentSupirArmada.findMany({
      where: { status: StatusAssignment.AKTIF },
      include: {
        supir: true,
        armada: true,
      },
    });
  }

  async findAssignmentsByDriver(supirId: number) {
    const supir = await this.prisma.supir.findUnique({ where: { supirId } });

    if (!supir) throw new NotFoundException(`Supir dengan ID ${supirId} tidak ditemukan`);

    return this.prisma.assignmentSupirArmada.findMany({
      where: { supirId },
      include: { armada: true },
    });
  }

  async findAssignmentsByVehicle(armadaId: number) {
    const armada = await this.prisma.armada.findUnique({ where: { armadaId } });

    if (!armada) throw new NotFoundException(`Armada dengan ID ${armadaId} tidak ditemukan`);

    return this.prisma.assignmentSupirArmada.findMany({
      where: { armadaId },
      include: { supir: true },
    });
  }
}
