import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupirDto } from '../dto/create_supir.dto';
import { UpdateSupirDto } from '../dto/update_supir.dto';
import { Prisma } from '@prisma/client';


@Injectable()
export class SupirService {
  constructor(private prisma: PrismaService) {}

  
  
  async create(data: CreateSupirDto) {
    return this.prisma.supir.create({ data });
  }
  
  async findAll() {
    return this.prisma.supir.findMany();
  }
  async delete(supirId: number) {
    try {
      if (!supirId) {
        throw new Error('supir_id is required');
      }
      await this.prisma.supir.delete({ where: { supirId } });

      return { message: 'Supir deleted' };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // Not found
        if (e.code === 'P2025') {
          throw new NotFoundException('Supir not found');
        }
      }
      throw e;
    }
  }

  async findOne(id: number) {
    const supir = await this.prisma.supir.findUnique({ where: { supirId: id } });
    if (!supir) throw new NotFoundException(`Supir with ID ${id} not found`);
    return supir;
  }

  async update(id: number, data: UpdateSupirDto) {
    await this.findOne(id); // check existence
    return this.prisma.supir.update({
      where: { supirId: id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // check existence
    return this.prisma.supir.delete({ where: { supirId: id } });
  }

  async getAvailableSupir(start: Date, end: Date) {
    return this.prisma.supir.findMany({
      where: {
        NOT: {
          booking: {
            some: {
              statusBooking: {
                in: ["confirmed", "ongoing"],
              },
              AND: [
                { tanggalMulaiWisata: { lte: end } },
                { tanggalSelesaiWisata: { gte: start } },
              ],
            },
          },
        },
      },
    });
  }
}
