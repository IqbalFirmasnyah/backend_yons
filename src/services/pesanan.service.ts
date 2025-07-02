// pesanan.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePesananDto } from '../dto/create_pesanan.dto';
import { UpdatePesananDto } from '../dto/update_pesanan.dto';
import { QueryPesananDto } from '../dto/query_pesanan.dto';
import { PesananResponseDto } from '../dto/pesanan_response.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PesananService {
  constructor(private prisma: PrismaService) {}

  // Helper method untuk konversi Decimal ke number
  private convertDecimalToNumber(value: Decimal | null | undefined): number {
    if (!value) return 0;
    return parseFloat(value.toString());
  }

  // Helper method untuk format response
  private formatPesananResponse(pesanan: any): PesananResponseDto {
    return {
      ...pesanan,
      totalHarga: this.convertDecimalToNumber(pesanan.totalHarga),
      paket: {
        ...pesanan.paket,
        harga: this.convertDecimalToNumber(pesanan.paket.harga)
      }
    };
  }

  async create(createPesananDto: CreatePesananDto): Promise<PesananResponseDto> {
    const {
      userId,
      paketId,
      supirId,
      armadaId,
      tanggalMulaiWisata,
      tanggalSelesaiWisata,
      jumlahPeserta,
      totalHarga,
      catatanKhusus
    } = createPesananDto;

    // Validasi tanggal
    const startDate = new Date(tanggalMulaiWisata);
    const endDate = new Date(tanggalSelesaiWisata);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('Tanggal mulai wisata tidak boleh di masa lalu');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('Tanggal selesai harus setelah tanggal mulai');
    }

    // Validasi user exists
    const user = await this.prisma.user.findUnique({
      where: { userId, statusAktif: true }
    });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan atau tidak aktif');
    }

    // Validasi paket exists
    const paket = await this.prisma.paketWisata.findUnique({
      where: { paketId, statusPaket: 'aktif' }
    });
    if (!paket) {
      throw new NotFoundException('Paket wisata tidak ditemukan atau tidak aktif');
    }

    // Validasi supir exists dan tersedia
    const supir = await this.prisma.supir.findUnique({
      where: { supirId, statusSupir: 'tersedia' }
    });
    if (!supir) {
      throw new NotFoundException('Supir tidak ditemukan atau tidak tersedia');
    }

    // Validasi armada exists dan tersedia
    const armada = await this.prisma.armada.findUnique({
      where: { armadaId, statusArmada: 'tersedia' }
    });
    if (!armada) {
      throw new NotFoundException('Armada tidak ditemukan atau tidak tersedia');
    }

    // Validasi kapasitas armada
    if (jumlahPeserta > armada.kapasitas) {
      throw new BadRequestException(`Jumlah peserta (${jumlahPeserta}) melebihi kapasitas armada (${armada.kapasitas})`);
    }

    // Cek konflik jadwal supir
    const conflictSupir = await this.prisma.pesanan.findFirst({
      where: {
        supirId,
        statusPesanan: { in: ['confirmed', 'ongoing'] },
        OR: [
          {
            AND: [
              { tanggalMulaiWisata: { lte: endDate } },
              { tanggalSelesaiWisata: { gte: startDate } }
            ]
          }
        ]
      }
    });

    if (conflictSupir) {
      throw new ConflictException('Supir sudah memiliki jadwal pada tanggal tersebut');
    }

    // Cek konflik jadwal armada
    const conflictArmada = await this.prisma.pesanan.findFirst({
      where: {
        armadaId,
        statusPesanan: { in: ['confirmed', 'ongoing'] },
        OR: [
          {
            AND: [
              { tanggalMulaiWisata: { lte: endDate } },
              { tanggalSelesaiWisata: { gte: startDate } }
            ]
          }
        ]
      }
    });

    if (conflictArmada) {
      throw new ConflictException('Armada sudah memiliki jadwal pada tanggal tersebut');
    }

    // Buat pesanan
    const pesanan = await this.prisma.pesanan.create({
      data: {
        userId,
        paketId,
        supirId,
        armadaId,
        tanggalPesan: new Date(),
        tanggalMulaiWisata: startDate,
        tanggalSelesaiWisata: endDate,
        jumlahPeserta,
        totalHarga,
        statusPesanan: 'pending',
        catatanKhusus
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
        paket: {
          select: {
            paketId: true,
            namaPaket: true,
            namaTempat: true,
            lokasi: true,
            harga: true
          }
        },
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

    return this.formatPesananResponse(pesanan);
  }

  async findAll(query: QueryPesananDto): Promise<{ data: PesananResponseDto[]; total: number; page: number; limit: number }> {
    const { userId, statusPesanan, tanggalMulaiDari, tanggalMulaiSampai, page = 1, limit = 10 } = query;
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (statusPesanan) where.statusPesanan = statusPesanan;
    
    if (tanggalMulaiDari || tanggalMulaiSampai) {
      where.tanggalMulaiWisata = {};
      if (tanggalMulaiDari) where.tanggalMulaiWisata.gte = new Date(tanggalMulaiDari);
      if (tanggalMulaiSampai) where.tanggalMulaiWisata.lte = new Date(tanggalMulaiSampai);
    }

    const [data, total] = await Promise.all([
      this.prisma.pesanan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              userId: true,
              username: true,
              namaLengkap: true,
              email: true
            }
          },
          paket: {
            select: {
              paketId: true,
              namaPaket: true,
              namaTempat: true,
              lokasi: true,
              harga: true
            }
          },
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
      this.prisma.pesanan.count({ where })
    ]);

    return {
      data: data.map(pesanan => this.formatPesananResponse(pesanan)),
      total,
      page,
      limit
    };
  }

  async findOne(id: number): Promise<PesananResponseDto> {
    const pesanan = await this.prisma.pesanan.findUnique({
      where: { pesananId: id },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            namaLengkap: true,
            email: true
          }
        },
        paket: {
          select: {
            paketId: true,
            namaPaket: true,
            namaTempat: true,
            lokasi: true,
            harga: true
          }
        },
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

    if (!pesanan) {
      throw new NotFoundException(`Pesanan dengan ID ${id} tidak ditemukan`);
    }

    return this.formatPesananResponse(pesanan);
  }

  async update(id: number, updatePesananDto: UpdatePesananDto): Promise<PesananResponseDto> {
    const existingPesanan = await this.findOne(id);

    // Validasi status update
    if (updatePesananDto.statusPesanan) {
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['ongoing', 'cancelled'],
        'ongoing': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': []
      };

      const currentStatus = existingPesanan.statusPesanan;
      const newStatus = updatePesananDto.statusPesanan;

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new BadRequestException(`Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}`);
      }
    }

    const pesanan = await this.prisma.pesanan.update({
      where: { pesananId: id },
      data: updatePesananDto,
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            namaLengkap: true,
            email: true
          }
        },
        paket: {
          select: {
            paketId: true,
            namaPaket: true,
            namaTempat: true,
            lokasi: true,
            harga: true
          }
        },
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

    return this.formatPesananResponse(pesanan);
  }

  async remove(id: number): Promise<{ message: string }> {
    const pesanan = await this.findOne(id);

    if (pesanan.statusPesanan === 'ongoing') {
      throw new BadRequestException('Tidak dapat menghapus pesanan yang sedang berlangsung');
    }

    await this.prisma.pesanan.delete({
      where: { pesananId: id }
    });

    return { message: `Pesanan dengan ID ${id} berhasil dihapus` };
  }

  async getStatistics(): Promise<any> {
    const [
      totalPesanan,
      pesananPending,
      pesananConfirmed,
      pesananOngoing,
      pesananCompleted,
      pesananCancelled,
      totalRevenue
    ] = await Promise.all([
      this.prisma.pesanan.count(),
      this.prisma.pesanan.count({ where: { statusPesanan: 'pending' } }),
      this.prisma.pesanan.count({ where: { statusPesanan: 'confirmed' } }),
      this.prisma.pesanan.count({ where: { statusPesanan: 'ongoing' } }),
      this.prisma.pesanan.count({ where: { statusPesanan: 'completed' } }),
      this.prisma.pesanan.count({ where: { statusPesanan: 'cancelled' } }),
      this.prisma.pesanan.aggregate({
        where: { statusPesanan: 'completed' },
        _sum: { totalHarga: true }
      })
    ]);

    return {
      totalPesanan,
      statusBreakdown: {
        pending: pesananPending,
        confirmed: pesananConfirmed,
        ongoing: pesananOngoing,
        completed: pesananCompleted,
        cancelled: pesananCancelled
      },
      totalRevenue: this.convertDecimalToNumber(totalRevenue._sum.totalHarga)
    };
  }
}