import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaketWisataLuarKotaDto } from 'src/dto/create_paket_wisata_luar.dto';
import { Prisma } from '@prisma/client';
import { UpdatePaketWisataLuarKotaDto } from 'src/dto/update_paket_wisata_luar.dto';

@Injectable()
export class PaketWisataLuarKotaService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePaketWisataLuarKotaDto) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Create paket wisata luar kota
        const paket = await tx.paketWisataLuarKota.create({
          data: {
            namaPaket: createDto.namaPaket,
            tujuanUtama: createDto.tujuanUtama,
            totalJarakKm: createDto.totalJarakKm,
            estimasiDurasi: createDto.estimasiDurasi,
            hargaEstimasi: createDto.hargaEstimasi,
            statusPaket: createDto.statusPaket,
          },
        });

        // Create detail rute
        const detailRute = await Promise.all(
          createDto.detailRute.map((rute) =>
            tx.detailRuteLuarKota.create({
              data: {
                paketLuarKotaId: paket.paketLuarKotaId,
                urutanKe: rute.urutanKe,
                namaDestinasi: rute.namaDestinasi,
                alamatDestinasi: rute.alamatDestinasi,
                jarakDariSebelumnyaKm: rute.jarakDariSebelumnyaKm,
                estimasiWaktuTempuh: rute.estimasiWaktuTempuh,
                waktuKunjunganMenit: rute.waktuKunjunganMenit,
                deskripsiSingkat: rute.deskripsiSingkat,
              },
            })
          )
        );

        return { ...paket, detailRute };
      });

      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(`Database error: ${error.message}`);
      }
      throw error;
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.PaketWisataLuarKotaWhereInput;
    orderBy?: Prisma.PaketWisataLuarKotaOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};

    const [data, total] = await Promise.all([
      this.prisma.paketWisataLuarKota.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          detailRute: {
            orderBy: { urutanKe: 'asc' },
          },
          _count: {
            select: {
              pesananLuarKota: true,
              booking: true,
            },
          },
        },
      }),
      this.prisma.paketWisataLuarKota.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page: skip ? Math.floor(skip / (take || 10)) + 1 : 1,
        limit: take || 10,
        totalPages: Math.ceil(total / (take || 10)),
      },
    };
  }

  async findOne(id: number) {
    const paket = await this.prisma.paketWisataLuarKota.findUnique({
      where: { paketLuarKotaId: id },
      include: {
        detailRute: {
          orderBy: { urutanKe: 'asc' },
        },
        _count: {
          select: {
            pesananLuarKota: true,
            booking: true,
          },
        },
      },
    });

    if (!paket) {
      throw new NotFoundException(`Paket wisata luar kota dengan ID ${id} tidak ditemukan`);
    }

    return paket;
  }

  async update(id: number, updateDto: UpdatePaketWisataLuarKotaDto) {
    const existingPaket = await this.findOne(id);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Update paket wisata luar kota
        const updatedPaket = await tx.paketWisataLuarKota.update({
          where: { paketLuarKotaId: id },
          data: {
            namaPaket: updateDto.namaPaket,
            tujuanUtama: updateDto.tujuanUtama,
            totalJarakKm: updateDto.totalJarakKm,
            estimasiDurasi: updateDto.estimasiDurasi,
            hargaEstimasi: updateDto.hargaEstimasi,
            statusPaket: updateDto.statusPaket,
          },
        });

        // Update detail rute if provided
        if (updateDto.detailRute) {
          // Delete existing routes
          await tx.detailRuteLuarKota.deleteMany({
            where: { paketLuarKotaId: id },
          });

          // Create new routes
          const detailRute = await Promise.all(
            updateDto.detailRute.map((rute) =>
              tx.detailRuteLuarKota.create({
                data: {
                  paketLuarKotaId: id,
                  urutanKe: rute.urutanKe,
                  namaDestinasi: rute.namaDestinasi,
                  alamatDestinasi: rute.alamatDestinasi,
                  jarakDariSebelumnyaKm: rute.jarakDariSebelumnyaKm,
                  estimasiWaktuTempuh: rute.estimasiWaktuTempuh,
                  waktuKunjunganMenit: rute.waktuKunjunganMenit,
                  deskripsiSingkat: rute.deskripsiSingkat,
                },
              })
            )
          );

          return { ...updatedPaket, detailRute };
        }

        return updatedPaket;
      });

      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(`Database error: ${error.message}`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    const existingPaket = await this.findOne(id);

    // Check if paket has any active bookings or orders
    const activeBookings = await this.prisma.booking.count({
      where: {
        paketLuarKotaId: id,
        statusBooking: {
          in: ['confirmed', 'pending_payment', 'payment_verified'],
        },
      },
    });

    const activePesanan = await this.prisma.pesananLuarKota.count({
      where: {
        paketLuarKotaId: id,
        statusPesanan: {
          in: ['confirmed', 'ongoing'],
        },
      },
    });

    if (activeBookings > 0 || activePesanan > 0) {
      throw new BadRequestException(
        'Tidak dapat menghapus paket wisata yang memiliki booking atau pesanan aktif'
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete detail rute first (due to foreign key constraint)
        await tx.detailRuteLuarKota.deleteMany({
          where: { paketLuarKotaId: id },
        });

        // Delete the paket
        await tx.paketWisataLuarKota.delete({
          where: { paketLuarKotaId: id },
        });
      });

      return { message: 'Paket wisata luar kota berhasil dihapus' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(`Database error: ${error.message}`);
      }
      throw error;
    }
  }

  async updateStatus(id: number, status: string) {
    const existingPaket = await this.findOne(id);

    const validStatuses = ['draft', 'aktif', 'non_aktif'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Status tidak valid');
    }

    return this.prisma.paketWisataLuarKota.update({
      where: { paketLuarKotaId: id },
      data: { statusPaket: status },
      include: {
        detailRute: {
          orderBy: { urutanKe: 'asc' },
        },
      },
    });
  }

  async getActivePackages() {
    return this.findAll({
      where: { statusPaket: 'aktif' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchPackages(query: string) {
    return this.findAll({
      where: {
        OR: [
          { namaPaket: { contains: query, mode: 'insensitive' } },
          { tujuanUtama: { contains: query, mode: 'insensitive' } },
          {
            detailRute: {
              some: {
                namaDestinasi: { contains: query, mode: 'insensitive' },
              },
            },
          },
        ],
        statusPaket: 'aktif',
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}