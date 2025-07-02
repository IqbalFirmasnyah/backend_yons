import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; 
import { CreateDetailRuteDto } from '../dto/create_detail_rute.dto';
import { UpdateDetailRuteDto } from '../dto/update_detail_rute.dto';

@Injectable()
export class DetailRuteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDetailRuteDto) {
    return this.prisma.detailRuteLuarKota.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.detailRuteLuarKota.findMany({
      include: {
        paketLuarKota: true,
      },
    });
  }

  async findOne(id: number) {
    const rute = await this.prisma.detailRuteLuarKota.findUnique({
      where: { ruteId: id },
      include: {
        paketLuarKota: true,
      },
    });

    if (!rute) throw new NotFoundException('Detail rute tidak ditemukan');
    return rute;
  }

  async update(id: number, dto: UpdateDetailRuteDto) {
    await this.findOne(id); // pastikan data ada
    return this.prisma.detailRuteLuarKota.update({
      where: { ruteId: id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.detailRuteLuarKota.delete({
      where: { ruteId: id },
    });
  }
}
