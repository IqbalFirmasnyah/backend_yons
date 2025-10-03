import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDetailRuteDto } from '../dto/create_detail_rute.dto';
import { UpdateDetailRuteDto } from '../dto/update_detail_rute.dto';
import { Prisma, DetailRuteLuarKota } from '@prisma/client';

@Injectable()
export class DetailRuteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDetailRuteDto): Promise<DetailRuteLuarKota> {
    const paketLuarKota = await this.prisma.paketWisataLuarKota.findUnique({
      where: { paketLuarKotaId: dto.paketLuarKotaId },
    });

    if (!paketLuarKota) {
      throw new NotFoundException(`Paket Wisata Luar Kota with ID ${dto.paketLuarKotaId} not found.`);
    }

    const { paketLuarKotaId, ...restOfDto } = dto; // Extract paketLuarKotaId

    try {
      return this.prisma.detailRuteLuarKota.create({
        data: {
          ...restOfDto, // Spread remaining properties (urutanKe, namaDestinasi, etc.)
          paketLuarKota: { connect: { paketLuarKotaId: paketLuarKotaId } }, // Connect the relation
        },
      });
    } catch (error) {
      console.error('Error creating DetailRuteLuarKota:', error);
      throw error;
    }
  }

  async findAll(): Promise<DetailRuteLuarKota[]> {
    return this.prisma.detailRuteLuarKota.findMany({
      include: {
        paketLuarKota: true,
      },
    });
  }

  async findOne(id: number): Promise<DetailRuteLuarKota> {
    const rute = await this.prisma.detailRuteLuarKota.findUnique({
      where: { ruteId: id },
      include: {
        paketLuarKota: true,
      },
    });

    if (!rute) {
      throw new NotFoundException('Detail rute tidak ditemukan');
    }
    return rute;
  }

  async update(id: number, dto: UpdateDetailRuteDto): Promise<DetailRuteLuarKota> {
    await this.findOne(id); // Ensure data exists

    const dataToUpdate: Prisma.DetailRuteLuarKotaUpdateInput = {
      // Scalar fields that can be updated directly, ensure they are not PK or FKs handled by relations
      // Use nullish coalescing to ensure only present values from DTO are included
      urutanKe: dto.urutanKe ?? undefined,
      namaDestinasi: dto.namaDestinasi ?? undefined,
      alamatDestinasi: dto.alamatDestinasi ?? undefined,
      jarakDariSebelumnyaKm: dto.jarakDariSebelumnyaKm ?? undefined,
      estimasiWaktuTempuh: dto.estimasiWaktuTempuh ?? undefined,
      waktuKunjunganMenit: dto.waktuKunjunganMenit ?? undefined,
      deskripsiSingkat: dto.deskripsiSingkat ?? undefined,
    };

    // Handle updates for the REQUIRED relation 'paketLuarKota'
    if (dto.paketLuarKotaId !== undefined) {
      if (dto.paketLuarKotaId === null) {
        // If client explicitly tries to send null for a REQUIRED relation
        throw new BadRequestException('Paket Wisata Luar Kota ID cannot be null, as it is a required relation for Detail Rute.');
      }
      const paketLuarKota = await this.prisma.paketWisataLuarKota.findUnique({
        where: { paketLuarKotaId: dto.paketLuarKotaId },
      });
      if (!paketLuarKota) {
        throw new NotFoundException(`Paket Wisata Luar Kota with ID ${dto.paketLuarKotaId} not found.`);
      }
      dataToUpdate.paketLuarKota = { connect: { paketLuarKotaId: dto.paketLuarKotaId } };
    }

    try {
      return this.prisma.detailRuteLuarKota.update({
        where: { ruteId: id },
        data: dataToUpdate,
      });
    } catch (error) {
      console.error('Error updating DetailRuteLuarKota:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Detail Rute with ID ${id} not found.`);
        }
      }
      throw error;
    }
  }

  async remove(id: number): Promise<DetailRuteLuarKota> {
    await this.findOne(id);
    return this.prisma.detailRuteLuarKota.delete({
      where: { ruteId: id },
    });
  }
}