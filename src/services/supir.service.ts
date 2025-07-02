import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupirDto } from '../dto/create_supir.dto';
import { UpdateSupirDto } from '../dto/update_supir.dto';

@Injectable()
export class SupirService {
  delete(id: number) {
      throw new Error('Method not implemented.');
  }
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSupirDto) {
    return this.prisma.supir.create({ data });
  }

  async findAll() {
    return this.prisma.supir.findMany();
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
}
