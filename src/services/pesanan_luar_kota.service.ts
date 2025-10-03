import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePesananLuarKotaDto } from 'src/dto/create_pesanan_luar_kota.dto';
import { UpdatePesananLuarKotaDto } from 'src/dto/update_pesanan_luar_kota.dto';
import { PesananLuarKota, Prisma } from '@prisma/client';
import { JenisFasilitasEnum } from 'src/dto/create-fasilitas.dto';

@Injectable()
export class PesananLuarKotaService {
  constructor(private prisma: PrismaService) {}

  async createPesananLuarKota(dto: CreatePesananLuarKotaDto): Promise<PesananLuarKota> {
    if (dto.paketLuarKotaId && dto.fasilitasId) {
      throw new BadRequestException('Only one of paketLuarKotaId or fasilitasId can be provided.');
    }
    if (!dto.paketLuarKotaId && !dto.fasilitasId) {
      throw new BadRequestException('Either paketLuarKotaId or fasilitasId must be provided.');
    }

    const [user, supir, armada] = await this.prisma.$transaction([
      this.prisma.user.findUnique({ where: { userId: 1 } }), // **IMPORTANT: Replace 1 with dynamic userId from context**
      this.prisma.supir.findUnique({ where: { supirId: dto.supirId } }),
      this.prisma.armada.findUnique({ where: { armadaId: dto.armadaId } }),
    ]);

    if (!user) throw new NotFoundException('User not found. Please provide a valid user ID.');
    if (!supir) throw new NotFoundException(`Supir with ID ${dto.supirId} not found.`);
    if (!armada) throw new NotFoundException(`Armada with ID ${dto.armadaId} not found.`);

    let totalHargaFinal: Prisma.Decimal;
    let connectPaketLuarKota: Prisma.PaketWisataLuarKotaCreateNestedOneWithoutPesananLuarKotaInput | undefined;
    let connectFasilitas: Prisma.FasilitasCreateNestedOneWithoutPesananLuarKotaInput | undefined;

    if (dto.paketLuarKotaId) {
      const paketLuarKota = await this.prisma.paketWisataLuarKota.findUnique({
        where: { paketLuarKotaId: dto.paketLuarKotaId },
        select: { hargaEstimasi: true },
      });
      if (!paketLuarKota) {
        throw new NotFoundException(`Paket Wisata Luar Kota with ID ${dto.paketLuarKotaId} not found.`);
      }
      totalHargaFinal = paketLuarKota.hargaEstimasi;
      connectPaketLuarKota = { connect: { paketLuarKotaId: dto.paketLuarKotaId } };
    } else { // fasilitasId is provided
      const fasilitas = await this.prisma.fasilitas.findUnique({
        where: { fasilitasId: dto.fasilitasId },
        select: {
          jenisFasilitas: true,
          dropoff: { select: { hargaEstimasi: true } },
          customRute: { select: { hargaEstimasi: true } },
          paketLuarKota: { select: { hargaEstimasi: true } }
        },
      });

      if (!fasilitas) throw new NotFoundException(`Fasilitas with ID ${dto.fasilitasId} not found.`);

      switch (fasilitas.jenisFasilitas) {
        case JenisFasilitasEnum.DROPOFF:
          if (!fasilitas.dropoff) throw new BadRequestException('Fasilitas is of type dropoff but no associated dropoff details found.');
          totalHargaFinal = fasilitas.dropoff.hargaEstimasi;
          break;
        case JenisFasilitasEnum.CUSTOM:
          // PERBAIKAN: Akses elemen pertama dari array dan tambahkan validasi
          if (!fasilitas.customRute || fasilitas.customRute.length === 0) {
            throw new BadRequestException('Fasilitas is of type custom but no associated custom route details found.');
          }
          totalHargaFinal = fasilitas.customRute[0].hargaEstimasi;
          break;
        case JenisFasilitasEnum.PAKET_LUAR_KOTA:
          if (!fasilitas.paketLuarKota) {
            throw new BadRequestException('Fasilitas is of type paket_luar_kota but no associated paketLuarKota details found.');
          }
          totalHargaFinal = fasilitas.paketLuarKota.hargaEstimasi;
          break;
        default:
          throw new BadRequestException('Fasilitas type not supported for price calculation.');
      }
      connectFasilitas = { connect: { fasilitasId: dto.fasilitasId } };
    }

    try {
      return await this.prisma.pesananLuarKota.create({
        data: {
          user: { connect: { userId: user.userId } },
          supir: { connect: { supirId: dto.supirId } },
          armada: { connect: { armadaId: dto.armadaId } },
          tanggalPesan: new Date(),
          tanggalMulaiWisata: new Date(dto.tanggalMulaiWisata),
          tanggalSelesaiWisata: new Date(dto.tanggalSelesaiWisata),
          jumlahPeserta: dto.jumlahPeserta,
          inputTujuanUser: dto.inputTujuanUser,
          catatanKhusus: dto.catatanKhusus,
          totalHargaFinal: totalHargaFinal,
          statusPesanan: 'pending',
          ...(connectPaketLuarKota && { paketLuarKota: connectPaketLuarKota }),
          ...(connectFasilitas && { fasilitas: connectFasilitas }),
        },
      });
    } catch (error) {
      console.error('Prisma error creating pesanan luar kota:', error);
      throw error;
    }
  }

  async findAllPesananLuarKota(): Promise<PesananLuarKota[]> {
    return this.prisma.pesananLuarKota.findMany({
      include: {
        user: true,
        supir: true,
        armada: true,
        paketLuarKota: true,
        fasilitas: true,
      },
    });
  }

  async findOnePesananLuarKota(id: number): Promise<PesananLuarKota | null> {
    return this.prisma.pesananLuarKota.findUnique({
      where: { pesananLuarKotaId: id },
      include: {
        user: true,
        supir: true,
        armada: true,
        paketLuarKota: true,
        fasilitas: true,
      },
    });
  }

  async updatePesananLuarKota(id: number, dto: UpdatePesananLuarKotaDto): Promise<PesananLuarKota | null> {
    const existingPesanan = await this.prisma.pesananLuarKota.findUnique({
      where: { pesananLuarKotaId: id },
      // PERBAIKAN: Include relasi yang diperlukan untuk re-kalkulasi harga
      include: {
        fasilitas: {
          select: {
            jenisFasilitas: true,
            dropoff: { select: { hargaEstimasi: true } },
            customRute: { select: { hargaEstimasi: true } },
            paketLuarKota: { select: { hargaEstimasi: true } }
          }
        },
        paketLuarKota: { select: { hargaEstimasi: true } }
      }
    });

    if (!existingPesanan) return null;

    if (dto.paketLuarKotaId !== undefined && dto.fasilitasId !== undefined) {
      throw new BadRequestException('Only one of paketLuarKotaId or fasilitasId can be updated at a time.');
    }

    if (dto.supirId) {
      const supir = await this.prisma.supir.findUnique({ where: { supirId: dto.supirId } });
      if (!supir) throw new NotFoundException(`Supir with ID ${dto.supirId} not found.`);
    }
    if (dto.armadaId) {
      const armada = await this.prisma.armada.findUnique({ where: { armadaId: dto.armadaId } });
      if (!armada) throw new NotFoundException(`Armada with ID ${dto.armadaId} not found.`);
    }

    let newTotalHargaFinal: Prisma.Decimal | undefined;
    let connectDisconnectPaketLuarKota: Prisma.PaketWisataLuarKotaUpdateOneWithoutPesananLuarKotaNestedInput | undefined;
    let connectDisconnectFasilitas: Prisma.FasilitasUpdateOneWithoutPesananLuarKotaNestedInput | undefined;

    // Logic to determine the new price based on the updated DTO
    if (dto.paketLuarKotaId !== undefined) {
      if (dto.paketLuarKotaId === null) {
        connectDisconnectPaketLuarKota = { disconnect: true };
        newTotalHargaFinal = undefined;
      } else {
        const paketLuarKota = await this.prisma.paketWisataLuarKota.findUnique({
          where: { paketLuarKotaId: dto.paketLuarKotaId },
          select: { hargaEstimasi: true },
        });
        if (!paketLuarKota) throw new NotFoundException(`Paket Wisata Luar Kota with ID ${dto.paketLuarKotaId} not found.`);
        newTotalHargaFinal = paketLuarKota.hargaEstimasi;
        connectDisconnectPaketLuarKota = { connect: { paketLuarKotaId: dto.paketLuarKotaId } };
      }
    }

    if (dto.fasilitasId !== undefined) {
      if (dto.fasilitasId === null) {
        connectDisconnectFasilitas = { disconnect: true };
        newTotalHargaFinal = undefined;
      } else {
        const fasilitas = await this.prisma.fasilitas.findUnique({
          where: { fasilitasId: dto.fasilitasId },
          select: {
            jenisFasilitas: true,
            dropoff: { select: { hargaEstimasi: true } },
            customRute: { select: { hargaEstimasi: true } },
            paketLuarKota: { select: { hargaEstimasi: true } }
          },
        });

        if (!fasilitas) throw new NotFoundException(`Fasilitas with ID ${dto.fasilitasId} not found.`);

        switch (fasilitas.jenisFasilitas) {
          case JenisFasilitasEnum.DROPOFF:
            if (!fasilitas.dropoff) throw new BadRequestException('Fasilitas is of type dropoff but no associated dropoff details found.');
            newTotalHargaFinal = fasilitas.dropoff.hargaEstimasi;
            break;
          case JenisFasilitasEnum.CUSTOM:
            // PERBAIKAN: Akses elemen pertama dari array dan tambahkan validasi
            if (!fasilitas.customRute || fasilitas.customRute.length === 0) {
              throw new BadRequestException('Fasilitas is of type custom but no associated custom route details found.');
            }
            newTotalHargaFinal = fasilitas.customRute[0].hargaEstimasi;
            break;
          case JenisFasilitasEnum.PAKET_LUAR_KOTA:
            if (!fasilitas.paketLuarKota) {
              throw new BadRequestException('Fasilitas is of type paket_luar_kota but no associated paketLuarKota details found.');
            }
            newTotalHargaFinal = fasilitas.paketLuarKota.hargaEstimasi;
            break;
          default:
            throw new BadRequestException('Fasilitas type not supported for price calculation.');
        }
        connectDisconnectFasilitas = { connect: { fasilitasId: dto.fasilitasId } };
      }
    }

    const dataToUpdate: Prisma.PesananLuarKotaUpdateInput = {
      tanggalMulaiWisata: dto.tanggalMulaiWisata ? new Date(dto.tanggalMulaiWisata) : undefined,
      tanggalSelesaiWisata: dto.tanggalSelesaiWisata ? new Date(dto.tanggalSelesaiWisata) : undefined,
      jumlahPeserta: dto.jumlahPeserta,
      inputTujuanUser: dto.inputTujuanUser,
      catatanKhusus: dto.catatanKhusus,
      totalHargaFinal: newTotalHargaFinal,
    };

    if (dto.supirId !== undefined) {
      if (dto.supirId === null) {
        throw new BadRequestException('Supir ID cannot be null, as Supir is a required relation.');
      }
      dataToUpdate.supir = { connect: { supirId: dto.supirId } };
    }
    if (dto.armadaId !== undefined) {
      if (dto.armadaId === null) {
        throw new BadRequestException('Armada ID cannot be null, as Armada is a required relation.');
      }
      dataToUpdate.armada = { connect: { armadaId: dto.armadaId } };
    }

    if (connectDisconnectPaketLuarKota) {
        dataToUpdate.paketLuarKota = connectDisconnectPaketLuarKota;
    }
    if (connectDisconnectFasilitas) {
        dataToUpdate.fasilitas = connectDisconnectFasilitas;
    }

    if (dto.paketLuarKotaId !== undefined && dto.paketLuarKotaId !== null) {
        dataToUpdate.fasilitas = { disconnect: true };
    } else if (dto.fasilitasId !== undefined && dto.fasilitasId !== null) {
        dataToUpdate.paketLuarKota = { disconnect: true };
    }

    try {
      return await this.prisma.pesananLuarKota.update({
        where: { pesananLuarKotaId: id },
        data: dataToUpdate,
        include: {
          user: true, supir: true, armada: true, paketLuarKota: true, fasilitas: true
        }
      });
    } catch (error) {
      console.error(`Prisma error updating pesanan luar kota with ID ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Pesanan Luar Kota with ID ${id} not found.`);
        }
      }
      throw error;
    }
  }

  async removePesananLuarKota(id: number): Promise<boolean> {
    try {
      const result = await this.prisma.pesananLuarKota.delete({
        where: { pesananLuarKotaId: id },
      });
      return result !== null;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Pesanan Luar Kota with ID ${id} not found.`);
        }
      }
      console.error(`Error deleting pesanan luar kota with ID ${id}:`, error);
      throw error;
    }
  }
}