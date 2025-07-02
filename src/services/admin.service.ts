import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from '../dto/create_admin.dto';
import { UpdateAdminDto } from '../dto/update_admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateAdminDto) {
    return this.prisma.admin.create({ data });
  }

  findAll() {
    return this.prisma.admin.findMany();
  }

  async findOne(id: number) {
    const admin = await this.prisma.admin.findUnique({ where: { adminId: id } });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  async update(id: number, data: UpdateAdminDto) {
    await this.findOne(id); // ensure exists
    return this.prisma.admin.update({
      where: { adminId: id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // ensure exists
    return this.prisma.admin.delete({ where: { adminId: id } });
  }
}
