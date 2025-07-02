// src/paket-wisata/paket-wisata.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaketWisataDto } from '../dto/create_paket_wisata.dto';
import { UpdatePaketWisataDto } from '../dto/update_paket_wisata.dto';
import { PaketWisataQueryDto } from '../dto/paket_wisata_query.dto';
import { PaketWisataResponseDto } from '../dto/paket_wisata_response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaketWisataService {
  constructor(private prisma: PrismaService) {}

  async create(createPaketWisataDto: CreatePaketWisataDto): Promise<PaketWisataResponseDto> {
    try {
      const paketWisata = await this.prisma.paketWisata.create({
        data: {
          namaPaket: createPaketWisataDto.namaPaket,
          namaTempat: createPaketWisataDto.namaTempat,
          lokasi: createPaketWisataDto.lokasi,
          deskripsi: createPaketWisataDto.deskripsi,
          itinerary: createPaketWisataDto.itinerary,
          jarakKm: createPaketWisataDto.jarakKm,
          durasiHari: createPaketWisataDto.durasiHari,
          harga: createPaketWisataDto.harga,
          fotoPaket: createPaketWisataDto.fotoPaket,
          kategori: createPaketWisataDto.kategori,
          statusPaket: createPaketWisataDto.statusPaket || 'aktif',
        },
      });

      return this.mapToResponseDto(paketWisata);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('Failed to create paket wisata');
      }
      throw error;
    }
  }

  async findAll(query: PaketWisataQueryDto) {
    const { kategori, status, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaketWisataWhereInput = {};

    if (kategori) {
      where.kategori = kategori;
    }

    if (status) {
      where.statusPaket = status;
    }

    if (search) {
      where.OR = [
        { namaPaket: { contains: search, mode: 'insensitive' } },
        { namaTempat: { contains: search, mode: 'insensitive' } },
        { lokasi: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [paketWisata, total] = await Promise.all([
      this.prisma.paketWisata.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paketWisata.count({ where }),
    ]);

    return {
      data: paketWisata.map(paket => this.mapToResponseDto(paket)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<PaketWisataResponseDto> {
    const paketWisata = await this.prisma.paketWisata.findUnique({
      where: { paketId: id },
    });

    if (!paketWisata) {
      throw new NotFoundException(`Paket wisata with ID ${id} not found`);
    }

    return this.mapToResponseDto(paketWisata);
  }

  async update(id: number, updatePaketWisataDto: UpdatePaketWisataDto): Promise<PaketWisataResponseDto> {
    try {
      const existingPaket = await this.prisma.paketWisata.findUnique({
        where: { paketId: id },
      });

      if (!existingPaket) {
        throw new NotFoundException(`Paket wisata with ID ${id} not found`);
      }

      const updatedPaket = await this.prisma.paketWisata.update({
        where: { paketId: id },
        data: updatePaketWisataDto,
      });

      return this.mapToResponseDto(updatedPaket);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('Failed to update paket wisata');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const existingPaket = await this.prisma.paketWisata.findUnique({
        where: { paketId: id },
      });

      if (!existingPaket) {
        throw new NotFoundException(`Paket wisata with ID ${id} not found`);
      }

      await this.prisma.paketWisata.delete({
        where: { paketId: id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('Cannot delete paket wisata. It has related records.');
        }
        throw new BadRequestException('Failed to delete paket wisata');
      }
      throw error;
    }
  }

  async findByKategori(kategori: string): Promise<PaketWisataResponseDto[]> {
    const paketWisata = await this.prisma.paketWisata.findMany({
      where: {
        kategori,
        statusPaket: 'aktif',
      },
      orderBy: { createdAt: 'desc' },
    });

    return paketWisata.map(paket => this.mapToResponseDto(paket));
  }

  async updateStatus(id: number, status: string): Promise<PaketWisataResponseDto> {
    try {
      const updatedPaket = await this.prisma.paketWisata.update({
        where: { paketId: id },
        data: { statusPaket: status },
      });

      return this.mapToResponseDto(updatedPaket);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Paket wisata with ID ${id} not found`);
        }
        throw new BadRequestException('Failed to update status');
      }
      throw error;
    }
  }

  private mapToResponseDto(paket: any): PaketWisataResponseDto {
    return {
      paketId: paket.paketId,
      namaPaket: paket.namaPaket,
      namaTempat: paket.namaTempat,
      lokasi: paket.lokasi,
      deskripsi: paket.deskripsi,
      itinerary: paket.itinerary,
      jarakKm: paket.jarakKm,
      durasiHari: paket.durasiHari,
      harga: Number(paket.harga),
      fotoPaket: paket.fotoPaket,
      kategori: paket.kategori,
      statusPaket: paket.statusPaket,
      createdAt: paket.createdAt,
      updatedAt: paket.updatedAt,
    };
  }
}