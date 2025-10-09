import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDropoffDto } from 'src/dto/create-dropoff.dto';
import { Dropoff, Prisma } from '@prisma/client';
import { JenisFasilitasEnum } from 'src/dto/create-fasilitas.dto';
import { NominatimService } from './nominatim.service';
import { OsrmService } from './osrm.service';
import { UpdateDropoffDto } from 'src/dto/update-dropoff.dto';

@Injectable()
export class DropoffService {
  constructor(
    private prisma: PrismaService,
    private nominatimService: NominatimService,
    private osrmService: OsrmService,
  ) {}

  async createDropoff(dto: CreateDropoffDto): Promise<Dropoff> {
    try {
      const geocodeResult = await this.nominatimService.geocodeAddress(dto.alamatTujuan);
      if (!geocodeResult) throw new BadRequestException('Alamat tujuan tidak valid atau tidak ditemukan.');
  
      const startCoords = { lat: -6.2088, lon: 106.8456 };
      const { distanceKm, durationSeconds } = await this.osrmService.getRouteInfo(startCoords, {
        lat: geocodeResult.latitude, lon: geocodeResult.longitude,
      });
  
      const tarifPerKm = 5000;
  
      // ✅ Pastikan integer rupiah
      const hargaEstimasiInt = Math.round(distanceKm * tarifPerKm); // atau Math.ceil() kalau mau “pembulatan ke atas”
      const hargaEstimasi = new Prisma.Decimal(hargaEstimasiInt);
  
      return this.prisma.$transaction(async (prisma) => {
        const newFasilitas = await prisma.fasilitas.create({
          data: {
            jenisFasilitas: JenisFasilitasEnum.DROPOFF,
            namaFasilitas: `Dropoff to ${dto.namaTujuan}`,
            deskripsi: `Layanan dropoff ke ${dto.namaTujuan}. 
              Jarak: ${distanceKm.toFixed(2)} km, Durasi: ${(durationSeconds / 60).toFixed(0)} menit.`,
          },
        });
  
        const dropoffDate = new Date(dto.tanggalLayanan);
  
        const dropoff = await prisma.dropoff.create({
          data: {
            fasilitasId: newFasilitas.fasilitasId,
            namaTujuan: dto.namaTujuan,
            alamatTujuan: dto.alamatTujuan,
            alamatJemputan: dto.alamatJemputan,
            jarakKm: Math.round(distanceKm),            // ✅ integer km
            estimasiDurasi: Math.round(durationSeconds / 60),
            tanggalMulai: dropoffDate,
            tanggalSelesai: dropoffDate,
            hargaEstimasi,                              // ✅ sudah integer
          },
        });
  
        return dropoff;
      });
    } catch (error) {
      console.error('Error in createDropoff service method:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Gagal membuat layanan dropoff karena kesalahan server.');
    }
  }
  

  // --- Metode lainnya (findAll, findOne, update, remove) tetap sama ---
  async findAllDropoffs(): Promise<Dropoff[]> {
    return this.prisma.dropoff.findMany({
      include: {
        fasilitas: true,
      },
    });
  }

  async findOneDropoff(id: number): Promise<Dropoff | null> {
    return this.prisma.dropoff.findUnique({
      where: { dropoffId: id },
      include: {
        fasilitas: true,
      },
    });
  }

  async updateDropoff(
    id: number,
    dto: UpdateDropoffDto,
  ): Promise<Dropoff | null> {
    // Siapkan objek data untuk di-update
    const updateData: any = {
      ...dto,
    };

    // 🔑 PERUBAHAN UTAMA:
    if (dto.tanggalLayanan) {
      const dropoffDate = new Date(dto.tanggalLayanan);

      // Ganti 'tanggalLayanan' dengan 'tanggalMulai' dan 'tanggalSelesai'
      updateData.tanggalMulai = dropoffDate;
      updateData.tanggalSelesai = dropoffDate;

      // Hapus properti tanggalLayanan dari objek data jika ada
      delete updateData.tanggalLayanan;
    }

    // Catatan: Jika Anda tidak menghapus tanggalLayanan dari DTO,
    // Anda akan mendapatkan error karena 'tanggalLayanan' bukan properti Dropoff.

    try {
      return await this.prisma.dropoff.update({
        where: { dropoffId: id },
        data: updateData, // Gunakan objek data yang sudah disesuaikan
      });
    } catch (error) {
      console.error(`Error updating dropoff with ID ${id} in service:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Dropoff with ID ${id} not found.`);
        }
      }
      throw new InternalServerErrorException(
        'Gagal memperbarui layanan dropoff.',
      );
    }
  }

  async removeDropoff(id: number): Promise<boolean> {
    try {
      const existingDropoff = await this.prisma.dropoff.findUnique({
        where: { dropoffId: id },
      });
      if (!existingDropoff) {
        return false; // Return false jika tidak ditemukan, controller akan menangani 404
      }

      await this.prisma.$transaction(async (prisma) => {
        await prisma.dropoff.delete({ where: { dropoffId: id } });
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      console.error(`Error deleting dropoff with ID ${id}:`, error);
      throw new InternalServerErrorException(
        'Gagal menghapus layanan dropoff.',
      );
    }
  }
}
