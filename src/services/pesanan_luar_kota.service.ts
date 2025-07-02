// pesanan-luar-kota.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePesananLuarKotaDto } from 'src/dto/create_pesanan_luar_kota.dto';
import { UpdatePesananLuarKotaDto } from 'src/dto/update_pesanan_luar_kota.dto';
import { QueryPesananLuarKotaDto } from 'src/dto/query_pesanan_luar_kota.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PesananLuarKotaService {
  findAllAdmin(query: QueryPesananLuarKotaDto) {
      throw new Error('Method not implemented.');
  }
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createDto: CreatePesananLuarKotaDto) {
    // Validasi paket wisata luar kota exists
    const paketExists = await this.prisma.paketWisataLuarKota.findUnique({
      where: { paketLuarKotaId: createDto.paketLuarKotaId }
    });
    
    if (!paketExists) {
      throw new NotFoundException('Paket wisata luar kota tidak ditemukan');
    }

    if (paketExists.statusPaket !== 'aktif') {
      throw new BadRequestException('Paket wisata luar kota tidak aktif');
    }

    // Validasi supir exists dan tersedia
    const supir = await this.prisma.supir.findUnique({
      where: { supirId: createDto.supirId }
    });

    if (!supir) {
      throw new NotFoundException('Supir tidak ditemukan');
    }

    if (supir.statusSupir !== 'tersedia') {
      throw new BadRequestException('Supir tidak tersedia');
    }

    // Validasi armada exists dan tersedia
    const armada = await this.prisma.armada.findUnique({
      where: { armadaId: createDto.armadaId }
    });

    if (!armada) {
      throw new NotFoundException('Armada tidak ditemukan');
    }

    if (armada.statusArmada !== 'tersedia') {
      throw new BadRequestException('Armada tidak tersedia');
    }

    // Validasi tanggal
    const tanggalMulai = new Date(createDto.tanggalMulaiWisata);
    const tanggalSelesai = new Date(createDto.tanggalSelesaiWisata);
    const today = new Date();

    if (tanggalMulai < today) {
      throw new BadRequestException('Tanggal mulai wisata tidak boleh kurang dari hari ini');
    }

    if (tanggalSelesai <= tanggalMulai) {
      throw new BadRequestException('Tanggal selesai wisata harus lebih besar dari tanggal mulai');
    }

    // Cek konflik jadwal supir dan armada
    await this.checkScheduleConflict(createDto.supirId, createDto.armadaId, tanggalMulai, tanggalSelesai);

    try {
      const pesanan = await this.prisma.pesananLuarKota.create({
        data: {
          userId,
          paketLuarKotaId: createDto.paketLuarKotaId,
          supirId: createDto.supirId,
          armadaId: createDto.armadaId,
          inputTujuanUser: createDto.inputTujuanUser,
          tanggalPesan: new Date(),
          tanggalMulaiWisata: tanggalMulai,
          tanggalSelesaiWisata: tanggalSelesai,
          jumlahPeserta: createDto.jumlahPeserta,
          totalHargaFinal: createDto.totalHargaFinal,
          statusPesanan: 'pending',
          catatanKhusus: createDto.catatanKhusus,
        },
        include: {
          user: {
            select: {
              userId: true,
              username: true,
              namaLengkap: true,
              email: true
            }
          },
          paketLuarKota: true,
          supir: {
            select: {
              supirId: true,
              nama: true,
              nomorHp: true,
              ratingRata: true
            }
          },
          armada: {
            select: {
              armadaId: true,
              jenisMobil: true,
              merkMobil: true,
              platNomor: true,
              kapasitas: true
            }
          }
        }
      });

      return pesanan;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('Gagal membuat pesanan luar kota');
      }
      throw error;
    }
  }

  async findAll(query: QueryPesananLuarKotaDto) {
    const { page = 1, limit = 10, search, status, userId, supirId, armadaId, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    
    const skip = (page - 1) * limit;
    
    const where: Prisma.PesananLuarKotaWhereInput = {};

    if (search) {
      where.paketLuarKota = {
        namaPaket: {
          contains: search,
          mode: 'insensitive'
        }
      };
    }

    if (status) {
      where.statusPesanan = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (supirId) {
      where.supirId = supirId;
    }

    if (armadaId) {
      where.armadaId = armadaId;
    }

    const [pesananList, total] = await Promise.all([
      this.prisma.pesananLuarKota.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          user: {
            select: {
              userId: true,
              username: true,
              namaLengkap: true,
              email: true
            }
          },
          paketLuarKota: true,
          supir: {
            select: {
              supirId: true,
              nama: true,
              nomorHp: true,
              ratingRata: true
            }
          },
          armada: {
            select: {
              armadaId: true,
              jenisMobil: true,
              merkMobil: true,
              platNomor: true,
              kapasitas: true
            }
          }
        }
      }),
      this.prisma.pesananLuarKota.count({ where })
    ]);

    return {
      data: pesananList,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: number) {
    const pesanan = await this.prisma.pesananLuarKota.findUnique({
      where: { pesananLuarKotaId: id },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            namaLengkap: true,
            email: true,
            noHp: true
          }
        },
        paketLuarKota: {
          include: {
            detailRute: {
              orderBy: {
                urutanKe: 'asc'
              }
            }
          }
        },
        supir: {
          select: {
            supirId: true,
            nama: true,
            nomorHp: true,
            ratingRata: true,
            pengalamanTahun: true
          }
        },
        armada: {
          select: {
            armadaId: true,
            jenisMobil: true,
            merkMobil: true,
            platNomor: true,
            kapasitas: true,
            tahunKendaraan: true
          }
        },
        pembayaran: true,
        notifikasi: true
      }
    });

    if (!pesanan) {
      throw new NotFoundException('Pesanan luar kota tidak ditemukan');
    }

    return pesanan;
  }

  async findByUser(userId: number, query: QueryPesananLuarKotaDto) {
    return this.findAll({ ...query, userId });
  }

  async update(id: number, updateDto: UpdatePesananLuarKotaDto, userId?: number) {
    const existingPesanan = await this.prisma.pesananLuarKota.findUnique({
      where: { pesananLuarKotaId: id }
    });

    if (!existingPesanan) {
      throw new NotFoundException('Pesanan luar kota tidak ditemukan');
    }

    // Validasi kepemilikan jika userId diberikan
    if (userId && existingPesanan.userId !== userId) {
      throw new ForbiddenException('Tidak memiliki akses untuk mengubah pesanan ini');
    }

    // Validasi status untuk update tertentu
    if (updateDto.statusPesanan && existingPesanan.statusPesanan === 'completed') {
      throw new BadRequestException('Tidak dapat mengubah pesanan yang sudah selesai');
    }

    // Validasi supir jika diubah
    if (updateDto.supirId && updateDto.supirId !== existingPesanan.supirId) {
      const supir = await this.prisma.supir.findUnique({
        where: { supirId: updateDto.supirId }
      });

      if (!supir || supir.statusSupir !== 'tersedia') {
        throw new BadRequestException('Supir tidak tersedia');
      }
    }

    // Validasi armada jika diubah
    if (updateDto.armadaId && updateDto.armadaId !== existingPesanan.armadaId) {
      const armada = await this.prisma.armada.findUnique({
        where: { armadaId: updateDto.armadaId }
      });

      if (!armada || armada.statusArmada !== 'tersedia') {
        throw new BadRequestException('Armada tidak tersedia');
      }
    }

    // Validasi tanggal jika diubah
    if (updateDto.tanggalMulaiWisata || updateDto.tanggalSelesaiWisata) {
      const tanggalMulai = updateDto.tanggalMulaiWisata 
        ? new Date(updateDto.tanggalMulaiWisata) 
        : existingPesanan.tanggalMulaiWisata;
      const tanggalSelesai = updateDto.tanggalSelesaiWisata 
        ? new Date(updateDto.tanggalSelesaiWisata) 
        : existingPesanan.tanggalSelesaiWisata;

      if (tanggalSelesai <= tanggalMulai) {
        throw new BadRequestException('Tanggal selesai wisata harus lebih besar dari tanggal mulai');
      }

      // Cek konflik jadwal jika tanggal atau resource berubah
      const supirId = updateDto.supirId || existingPesanan.supirId;
      const armadaId = updateDto.armadaId || existingPesanan.armadaId;
      
      await this.checkScheduleConflict(supirId, armadaId, tanggalMulai, tanggalSelesai, id);
    }

    try {
      const updatedPesanan = await this.prisma.pesananLuarKota.update({
        where: { pesananLuarKotaId: id },
        data: {
          ...(updateDto.supirId && { supirId: updateDto.supirId }),
          ...(updateDto.armadaId && { armadaId: updateDto.armadaId }),
          ...(updateDto.inputTujuanUser && { inputTujuanUser: updateDto.inputTujuanUser }),
          ...(updateDto.tanggalMulaiWisata && { tanggalMulaiWisata: new Date(updateDto.tanggalMulaiWisata) }),
          ...(updateDto.tanggalSelesaiWisata && { tanggalSelesaiWisata: new Date(updateDto.tanggalSelesaiWisata) }),
          ...(updateDto.jumlahPeserta && { jumlahPeserta: updateDto.jumlahPeserta }),
          ...(updateDto.totalHargaFinal && { totalHargaFinal: updateDto.totalHargaFinal }),
          ...(updateDto.statusPesanan && { statusPesanan: updateDto.statusPesanan }),
          ...(updateDto.catatanKhusus !== undefined && { catatanKhusus: updateDto.catatanKhusus }),
        },
        include: {
          user: {
            select: {
              userId: true,
              username: true,
              namaLengkap: true,
              email: true
            }
          },
          paketLuarKota: true,
          supir: {
            select: {
              supirId: true,
              nama: true,
              nomorHp: true,
              ratingRata: true
            }
          },
          armada: {
            select: {
              armadaId: true,
              jenisMobil: true,
              merkMobil: true,
              platNomor: true,
              kapasitas: true
            }
          }
        }
      });

      return updatedPesanan;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('Gagal mengubah pesanan luar kota');
      }
      throw error;
    }
  }

  async updateStatus(id: number, status: string) {
    const validStatuses = ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Status tidak valid');
    }

    const existingPesanan = await this.prisma.pesananLuarKota.findUnique({
      where: { pesananLuarKotaId: id }
    });

    if (!existingPesanan) {
      throw new NotFoundException('Pesanan luar kota tidak ditemukan');
    }

    return this.prisma.pesananLuarKota.update({
      where: { pesananLuarKotaId: id },
      data: { statusPesanan: status }
    });
  }

  async remove(id: number, userId?: number) {
    const existingPesanan = await this.prisma.pesananLuarKota.findUnique({
      where: { pesananLuarKotaId: id }
    });

    if (!existingPesanan) {
      throw new NotFoundException('Pesanan luar kota tidak ditemukan');
    }

    // Validasi kepemilikan jika userId diberikan
    if (userId && existingPesanan.userId !== userId) {
      throw new ForbiddenException('Tidak memiliki akses untuk menghapus pesanan ini');
    }

    // Validasi status - hanya bisa dihapus jika pending atau cancelled
    if (!['pending', 'cancelled'].includes(existingPesanan.statusPesanan)) {
      throw new BadRequestException('Hanya pesanan dengan status pending atau cancelled yang dapat dihapus');
    }

    try {
      await this.prisma.pesananLuarKota.delete({
        where: { pesananLuarKotaId: id }
      });

      return { message: 'Pesanan luar kota berhasil dihapus' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('Gagal menghapus pesanan luar kota');
      }
      throw error;
    }
  }

  // Helper method untuk cek konflik jadwal
  private async checkScheduleConflict(
    supirId: number,
    armadaId: number,
    tanggalMulai: Date,
    tanggalSelesai: Date,
    excludePesananId?: number
  ) {
    const whereCondition: Prisma.PesananLuarKotaWhereInput = {
      OR: [
        { supirId },
        { armadaId }
      ],
      statusPesanan: {
        in: ['confirmed', 'ongoing']
      },
      AND: [
        {
          tanggalMulaiWisata: {
            lte: tanggalSelesai
          }
        },
        {
          tanggalSelesaiWisata: {
            gte: tanggalMulai
          }
        }
      ]
    };

    if (excludePesananId) {
      whereCondition.pesananLuarKotaId = {
        not: excludePesananId
      };
    }

    const conflictingPesanan = await this.prisma.pesananLuarKota.findFirst({
      where: whereCondition,
      select: {
        pesananLuarKotaId: true,
        supirId: true,
        armadaId: true,
        tanggalMulaiWisata: true,
        tanggalSelesaiWisata: true
      }
    });

    if (conflictingPesanan) {
      if (conflictingPesanan.supirId === supirId) {
        throw new BadRequestException('Supir sudah memiliki jadwal pada tanggal tersebut');
      }
      if (conflictingPesanan.armadaId === armadaId) {
        throw new BadRequestException('Armada sudah digunakan pada tanggal tersebut');
      }
    }

    // Cek juga konflik dengan pesanan dalam kota
    const conflictingPesananDalamKota = await this.prisma.pesanan.findFirst({
      where: {
        OR: [
          { supirId },
          { armadaId }
        ],
        statusPesanan: {
          in: ['confirmed', 'ongoing']
        },
        AND: [
          {
            tanggalMulaiWisata: {
              lte: tanggalSelesai
            }
          },
          {
            tanggalSelesaiWisata: {
              gte: tanggalMulai
            }
          }
        ]
      }
    });

    if (conflictingPesananDalamKota) {
      throw new BadRequestException('Supir atau armada sudah memiliki jadwal pesanan lain pada tanggal tersebut');
    }
  }

  // Method untuk statistik
  async getStatistics() {
    const [total, pending, confirmed, ongoing, completed, cancelled] = await Promise.all([
      this.prisma.pesananLuarKota.count(),
      this.prisma.pesananLuarKota.count({ where: { statusPesanan: 'pending' } }),
      this.prisma.pesananLuarKota.count({ where: { statusPesanan: 'confirmed' } }),
      this.prisma.pesananLuarKota.count({ where: { statusPesanan: 'ongoing' } }),
      this.prisma.pesananLuarKota.count({ where: { statusPesanan: 'completed' } }),
      this.prisma.pesananLuarKota.count({ where: { statusPesanan: 'cancelled' } })
    ]);

    const totalRevenue = await this.prisma.pesananLuarKota.aggregate({
      where: { statusPesanan: 'completed' },
      _sum: { totalHargaFinal: true }
    });

    return {
      total,
      byStatus: {
        pending,
        confirmed,
        ongoing,
        completed,
        cancelled
      },
      totalRevenue: totalRevenue._sum.totalHargaFinal || 0
    };
  }
}