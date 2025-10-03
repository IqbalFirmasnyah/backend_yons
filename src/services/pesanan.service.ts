import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // Adjust path
import { CreatePesananDto } from '../dto/create_pesanan.dto'; // Adjust path
import { UpdatePesananDto, PesananStatusEnum } from '../dto/update_pesanan.dto'; // Adjust path and import enum
import { Pesanan, Prisma } from '@prisma/client';

@Injectable()
export class PesananService {
  constructor(private prisma: PrismaService) {}

  async createPesanan(dto: CreatePesananDto): Promise<Pesanan> {
    // Validate existence of all required related entities
    const [user, paket, supir, armada] = await this.prisma.$transaction([
      this.prisma.user.findUnique({ where: { userId: dto.userId } }),
      this.prisma.paketWisata.findUnique({ where: { paketId: dto.paketId } }),
      this.prisma.supir.findUnique({ where: { supirId: dto.supirId } }),
      this.prisma.armada.findUnique({ where: { armadaId: dto.armadaId } }),
    ]);

    if (!user) throw new NotFoundException(`User with ID ${dto.userId} not found.`);
    if (!paket) throw new NotFoundException(`Paket Wisata with ID ${dto.paketId} not found.`);
    if (!supir) throw new NotFoundException(`Supir with ID ${dto.supirId} not found.`);
    if (!armada) throw new NotFoundException(`Armada with ID ${dto.armadaId} not found.`);

    const totalHarga = paket.harga; // Get price from the selected package

    try {
      return await this.prisma.pesanan.create({
        data: {
          user: { connect: { userId: dto.userId } },
          paket: { connect: { paketId: dto.paketId } },
          supir: { connect: { supirId: dto.supirId } },
          armada: { connect: { armadaId: dto.armadaId } },
          tanggalPesan: new Date(), // Set current date for order creation
          tanggalMulaiWisata: new Date(dto.tanggalMulaiWisata),
          tanggalSelesaiWisata: new Date(dto.tanggalSelesaiWisata),
          jumlahPeserta: dto.jumlahPeserta,
          totalHarga: totalHarga, // Use the price from the package
          statusPesanan: PesananStatusEnum.PENDING, // Default status
          catatanKhusus: dto.catatanKhusus,
        },
      });
    } catch (error) {
      console.error('Prisma error creating pesanan:', error);
      // Handle specific Prisma errors if needed, e.g., unique constraints
      throw error;
    }
  }

  async findAllPesanan(): Promise<Pesanan[]> {
    return this.prisma.pesanan.findMany({
      include: {
        user: true,
        paket: true,
        supir: true,
        armada: true,
      },
    });
  }

  async findOnePesanan(id: number): Promise<Pesanan | null> {
    return this.prisma.pesanan.findUnique({
      where: { pesananId: id },
      include: {
        user: true,
        paket: true,
        supir: true,
        armada: true,
      },
    });
  }

  async updatePesanan(id: number, dto: UpdatePesananDto): Promise<Pesanan | null> {
    const existingPesanan = await this.prisma.pesanan.findUnique({ where: { pesananId: id } });
    if (!existingPesanan) {
      return null;
    }

    // Prepare data to update, handling required relations
    const dataToUpdate: Prisma.PesananUpdateInput = {
      // Scalar updates
      tanggalMulaiWisata: dto.tanggalMulaiWisata ? new Date(dto.tanggalMulaiWisata) : undefined,
      tanggalSelesaiWisata: dto.tanggalSelesaiWisata ? new Date(dto.tanggalSelesaiWisata) : undefined,
      jumlahPeserta: dto.jumlahPeserta ?? undefined,
      catatanKhusus: dto.catatanKhusus ?? undefined,
      statusPesanan: dto.statusPesanan ?? undefined,
    };

    // Handle updates for required relations (User, Paket, Supir, Armada)
    // Remember: These cannot be set to null. If provided in DTO, they must connect to an existing ID.
    if (dto.userId !== undefined) {
      if (dto.userId === null) throw new BadRequestException('User ID cannot be null, as User is a required relation.');
      const user = await this.prisma.user.findUnique({ where: { userId: dto.userId } });
      if (!user) throw new NotFoundException(`User with ID ${dto.userId} not found.`);
      dataToUpdate.user = { connect: { userId: dto.userId } };
    }

    if (dto.paketId !== undefined) {
      if (dto.paketId === null) throw new BadRequestException('Paket ID cannot be null, as Paket is a required relation.');
      const paket = await this.prisma.paketWisata.findUnique({ where: { paketId: dto.paketId } });
      if (!paket) throw new NotFoundException(`Paket Wisata with ID ${dto.paketId} not found.`);
      dataToUpdate.paket = { connect: { paketId: dto.paketId } };
      // If package changes, re-calculate totalHarga
      dataToUpdate.totalHarga = paket.harga;
    }

    if (dto.supirId !== undefined) {
      if (dto.supirId === null) throw new BadRequestException('Supir ID cannot be null, as Supir is a required relation.');
      const supir = await this.prisma.supir.findUnique({ where: { supirId: dto.supirId } });
      if (!supir) throw new NotFoundException(`Supir with ID ${dto.supirId} not found.`);
      dataToUpdate.supir = { connect: { supirId: dto.supirId } };
    }

    if (dto.armadaId !== undefined) {
      if (dto.armadaId === null) throw new BadRequestException('Armada ID cannot be null, as Armada is a required relation.');
      const armada = await this.prisma.armada.findUnique({ where: { armadaId: dto.armadaId } });
      if (!armada) throw new NotFoundException(`Armada with ID ${dto.armadaId} not found.`);
      dataToUpdate.armada = { connect: { armadaId: dto.armadaId } };
    }

    try {
      return await this.prisma.pesanan.update({
        where: { pesananId: id },
        data: dataToUpdate,
        include: {
          user: true, paket: true, supir: true, armada: true,
        },
      });
    } catch (error) {
      console.error(`Prisma error updating pesanan with ID ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Record to update not found
          throw new NotFoundException(`Pesanan with ID ${id} not found.`);
        }
      }
      throw error;
    }
  }

  async removePesanan(id: number): Promise<boolean> {
    try {
      const result = await this.prisma.pesanan.delete({
        where: { pesananId: id },
      });
      return result !== null;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Record not found
          throw new NotFoundException(`Pesanan with ID ${id} not found.`);
        }
      }
      console.error(`Error deleting pesanan with ID ${id}:`, error);
      throw error;
    }
  }
}