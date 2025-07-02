// src/services/armada.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArmadaDto } from '../dto/create_armada.dto';
import { UpdateArmadaDto } from '../dto/update_armada.dto';

@Injectable()
export class ArmadaService {
  constructor(private readonly prisma: PrismaService) {}

  async createArmada(createArmadaDto: CreateArmadaDto) {
    return this.prisma.armada.create({
      data: createArmadaDto,
    });
  }

  async findAllArmadas() {
    return this.prisma.armada.findMany();
  }

  async findOneById(armadaId: number) {
    const armada = await this.prisma.armada.findUnique({
      where: { armadaId },
    });
    
    if (!armada) {
      throw new NotFoundException(`Armada dengan ID ${armadaId} tidak ditemukan`);
    }
    
    return armada;
  }

  async updateArmada(armadaId: number, updateArmadaDto: UpdateArmadaDto) {
    // Pastikan armada exists
    await this.findOneById(armadaId);
    
    return this.prisma.armada.update({
      where: { armadaId },
      data: updateArmadaDto,
    });
  }

  async deleteArmada(armadaId: number): Promise<void> {
    // Pastikan armada exists
    await this.findOneById(armadaId);
    
    await this.prisma.armada.delete({
      where: { armadaId },
    });
  }
}