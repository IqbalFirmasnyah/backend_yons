import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNotifikasiDto } from '../dto/create_notifikasi.dto';
import { UpdateNotifikasiDto } from '../dto/update_notifikasi.dto';

@Injectable()
export class NotifikasiService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateNotifikasiDto) {
    return await this.prisma.notifikasi.create({
      data: {
        ...createDto,
        tanggalNotifikasi: createDto.tanggalNotifikasi ?? new Date(),
      },
    });
  }

  async findAll() {
    return await this.prisma.notifikasi.findMany({
      include: {
        user: true,
        admin: true,
        pesanan: true,
        pesananLuarKota: true,
        booking: true,
        refund: true,
      },
      orderBy: {
        tanggalNotifikasi: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const notifikasi = await this.prisma.notifikasi.findUnique({
      where: { notifikasiId: id },
      include: {
        user: true,
        admin: true,
        pesanan: true,
        pesananLuarKota: true,
        booking: true,
        refund: true,
      },
    });

    if (!notifikasi) {
      throw new NotFoundException(`Notifikasi dengan ID ${id} tidak ditemukan`);
    }

    return notifikasi;
  }

  async update(id: number, updateDto: UpdateNotifikasiDto) {
    // pastikan notifikasi ada
    await this.findOne(id);

    return await this.prisma.notifikasi.update({
      where: { notifikasiId: id },
      data: updateDto,
    });
  }

  async markAsRead(id: number) {
    // pastikan notifikasi ada
    await this.findOne(id);

    return await this.prisma.notifikasi.update({
      where: { notifikasiId: id },
      data: { isRead: true },
    });
  }

  async delete(id: number): Promise<void> {
    // pastikan notifikasi ada
    await this.findOne(id);

    await this.prisma.notifikasi.delete({
      where: { notifikasiId: id },
    });
  }
}
