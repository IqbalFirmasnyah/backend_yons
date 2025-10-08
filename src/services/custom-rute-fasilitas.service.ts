// src/services/custom-rute-fasilitas.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomRuteDto } from 'src/dto/create-custom-rute-fasilitas.dto';
import { UpdateCustomRuteDto } from 'src/dto/update-custom-rute-fasilitas.dto';
import { CustomRuteFasilitas, Prisma } from '@prisma/client';
import { JenisFasilitasEnum } from 'src/dto/create-fasilitas.dto';
import { NominatimService } from './nominatim.service';
import { OsrmService } from './osrm.service';

// Definisikan tipe data untuk objek rute yang sudah di-geocoding
type GeocodedTujuan = {
  nama: string;
  alamat: string;
  latitude: number;
  longitude: number;
  jarakDariSebelumnya: number;
  durasiDariSebelumnya: number;
};

@Injectable()
export class CustomRuteFasilitasService {
  constructor(
    private prisma: PrismaService,
    private nominatimService: NominatimService,
    private osrmService: OsrmService,
  ) {}

  async createCustomRuteFasilitas(dto: CreateCustomRuteDto): Promise<CustomRuteFasilitas> {
    try {
      const fasilitas = await this.prisma.fasilitas.findUnique({
        where: { fasilitasId: dto.fasilitasId },select: { jenisFasilitas: true },});
      if (!fasilitas) {
        throw new NotFoundException(`Fasilitas with ID ${dto.fasilitasId} not found.`); }
      if (fasilitas.jenisFasilitas !== JenisFasilitasEnum.CUSTOM) {
        throw new BadRequestException(`Fasilitas with ID ${dto.fasilitasId} is not of type 'custom'.`); }
      let totalJarakKm = 0;
      let estimasiDurasiMenit = 0;
      let previousCoords = { lat: -6.2088, lon: 106.8456 }; 
      const geocodedTujuanList: GeocodedTujuan[] = [];
      for (const tujuan of dto.tujuanList) {
        const geocodeResult = await this.nominatimService.geocodeAddress(tujuan.alamat);
        if (!geocodeResult) {
          throw new BadRequestException(`Alamat "${tujuan.alamat}" tidak valid atau tidak ditemukan.`); }
        const currentCoords = { lat: geocodeResult.latitude, lon: geocodeResult.longitude };
        const { distanceKm, durationSeconds } = await this.osrmService.getRouteInfo(previousCoords, currentCoords);       
        totalJarakKm += distanceKm;
        estimasiDurasiMenit += durationSeconds / 60;
        geocodedTujuanList.push({
          ...tujuan,
          latitude: currentCoords.lat,
          longitude: currentCoords.lon,
          jarakDariSebelumnya: distanceKm,
          durasiDariSebelumnya: durationSeconds,
          });
        previousCoords = currentCoords;}
      const tarifPerKm = 5000;
      const hargaEstimasi = new Prisma.Decimal(totalJarakKm * tarifPerKm);
      return await this.prisma.customRuteFasilitas.create({
        data: {
          fasilitasId: dto.fasilitasId,
          tujuanList: JSON.stringify(geocodedTujuanList),
          totalJarakKm: Math.round(totalJarakKm),
          estimasiDurasi: Math.round(estimasiDurasiMenit),
          tanggalMulai: new Date(dto.tanggalMulai), 
          tanggalSelesai: new Date(dto.tanggalSelesai),
          hargaEstimasi: hargaEstimasi,
          catatanKhusus: dto.catatanKhusus,
        },});
    } catch (error) {
      console.error('Error creating custom route fasilitas in service:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal membuat rute kustom fasilitas.');
    }
  }

  async findAllCustomRuteFasilitas(): Promise<CustomRuteFasilitas[]> {
    return this.prisma.customRuteFasilitas.findMany({
      include: {
        fasilitas: true,
      },
    });
  }

  async findOneCustomRuteFasilitas(id: number): Promise<CustomRuteFasilitas | null> {
    const customRute = await this.prisma.customRuteFasilitas.findUnique({
      where: { customRuteId: id },
      include: {
        fasilitas: true,
      },
    });
    if (!customRute) {
      throw new NotFoundException(`Custom Rute Fasilitas with ID ${id} not found.`);
    }
    return customRute;
  }

  async updateCustomRuteFasilitas(id: number, dto: UpdateCustomRuteDto): Promise<CustomRuteFasilitas | null> {
    let updateData: Prisma.CustomRuteFasilitasUpdateInput = {};

    // Jika fasilitasId diubah, validasi fasilitas baru
    if (dto.fasilitasId !== undefined && dto.fasilitasId !== null) {
      const fasilitas = await this.prisma.fasilitas.findUnique({
        where: { fasilitasId: dto.fasilitasId },
        select: { jenisFasilitas: true },
      });
      if (!fasilitas || fasilitas.jenisFasilitas !== JenisFasilitasEnum.CUSTOM) {
        throw new BadRequestException(`Fasilitas with ID ${dto.fasilitasId} is not of type 'custom' or not found.`);
      }
      updateData.fasilitas = { connect: { fasilitasId: dto.fasilitasId } };
    }

    // Jika tujuanList diubah, lakukan perhitungan ulang
    if (dto.tujuanList) {
      let totalJarakKm = 0;
      let estimasiDurasiMenit = 0;
      let previousCoords = { lat: -6.2088, lon: 106.8456 };
      const geocodedTujuanList: GeocodedTujuan[] = [];

      for (const tujuan of dto.tujuanList) {
        const geocodeResult = await this.nominatimService.geocodeAddress(tujuan.alamat);
        if (!geocodeResult) {
          throw new BadRequestException(`Alamat "${tujuan.alamat}" tidak valid atau tidak ditemukan.`);
        }

        const currentCoords = { lat: geocodeResult.latitude, lon: geocodeResult.longitude };
        const { distanceKm, durationSeconds } = await this.osrmService.getRouteInfo(previousCoords, currentCoords);
        
        totalJarakKm += distanceKm;
        estimasiDurasiMenit += durationSeconds / 60;

        geocodedTujuanList.push({
          ...tujuan,
          latitude: currentCoords.lat,
          longitude: currentCoords.lon,
          jarakDariSebelumnya: distanceKm,
          durasiDariSebelumnya: durationSeconds,
        });

        previousCoords = currentCoords;
      }

      const tarifPerKm = 5000;
      const hargaEstimasi = new Prisma.Decimal(totalJarakKm * tarifPerKm);
      
      updateData.tujuanList = JSON.stringify(geocodedTujuanList);
      updateData.totalJarakKm = Math.round(totalJarakKm);
      updateData.estimasiDurasi = Math.round(estimasiDurasiMenit);
      updateData.hargaEstimasi = hargaEstimasi;
    }

    // Tambahkan field lain yang diizinkan untuk di-update
    if (dto.tanggalMulai) {
      // TANGGAL MULAI
      updateData.tanggalMulai = new Date(dto.tanggalMulai);
      
      // Jika tanggal Selesai tidak dikirim, asumsikan rute 1 hari
      if (!dto.tanggalSelesai) {
          updateData.tanggalSelesai = new Date(dto.tanggalMulai); 
      }
  }
  
  // Jika tanggalSelesai diubah (dan sudah ada tanggalMulai atau tidak ada tanggalMulai yang diubah)
  if (dto.tanggalSelesai) {
      updateData.tanggalSelesai = new Date(dto.tanggalSelesai);
  }
  
  // Tambahkan field lain yang diizinkan untuk di-update
  if (dto.catatanKhusus !== undefined) {
      updateData.catatanKhusus = dto.catatanKhusus;
  }

    try {
      return await this.prisma.customRuteFasilitas.update({
        where: { customRuteId: id },
        data: updateData,
      });
    } catch (error) {
      console.error(`Error updating custom route fasilitas with ID ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Custom Rute Fasilitas with ID ${id} not found.`);
      }
      throw new InternalServerErrorException('Gagal memperbarui rute kustom fasilitas.');
    }
  }

  async removeCustomRuteFasilitas(id: number): Promise<boolean> {
    try {
      const result = await this.prisma.customRuteFasilitas.delete({
        where: { customRuteId: id },
      });
      return result !== null;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Custom Rute Fasilitas with ID ${id} not found.`);
      }
      console.error(`Error deleting custom route fasilitas with ID ${id}:`, error);
      throw new InternalServerErrorException('Gagal menghapus rute kustom fasilitas.');
    }
  }
}