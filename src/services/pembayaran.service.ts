// src/pembayaran/pembayaran.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePembayaranDto } from '../dto/create_pembayaran.dto';
import { UpdatePembayaranDto } from '../dto/update_pembayaran.dto';

@Injectable()
export class PembayaranService {
  constructor(private prisma: PrismaService) {}

  create(data: CreatePembayaranDto) {
    return this.prisma.pembayaran.create({ data });
  }

  findAll() {
    return this.prisma.pembayaran.findMany({
      include: {
        user: true,
        pesanan: true,
        pesananLuarKota: true,
        verifiedByAdmin: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.pembayaran.findUnique({
      where: { pembayaranId: id },
      include: {
        user: true,
        pesanan: true,
        pesananLuarKota: true,
        verifiedByAdmin: true,
      },
    });
  }

  update(id: number, data: UpdatePembayaranDto) {
    return this.prisma.pembayaran.update({
      where: { pembayaranId: id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.pembayaran.delete({
      where: { pembayaranId: id },
    });
  }
}
