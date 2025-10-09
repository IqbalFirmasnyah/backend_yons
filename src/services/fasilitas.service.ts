import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFasilitasDto, JenisFasilitasEnum } from 'src/dto/create-fasilitas.dto';
import { UpdateFasilitasDto } from 'src/dto/update-fasilitas.dto';
import { Fasilitas, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal untuk konversi harga

@Injectable()
export class FasilitasService {
  constructor(private prisma: PrismaService) {}

  async createFasilitas(createFasilitasDto: CreateFasilitasDto): Promise<Fasilitas> {
      const {
          jenisFasilitas,
          namaFasilitas,
          deskripsi,
          paketLuarKota,
      } = createFasilitasDto;

      let paketLuarKotaId: number | undefined;

      if (jenisFasilitas === JenisFasilitasEnum.PAKET_LUAR_KOTA) {
          if (!paketLuarKota) {
              throw new BadRequestException('Data paketLuarKota wajib diisi untuk fasilitas jenis "paket_luar_kota".');
          }

          try {
              const createdPaket = await this.prisma.paketWisataLuarKota.create({
                  data: {
                      namaPaket: paketLuarKota.namaPaket,
                      tujuanUtama: paketLuarKota.tujuanUtama,
                      totalJarakKm: paketLuarKota.totalJarakKm,
                      estimasiDurasi: paketLuarKota.estimasiDurasi,
                      hargaEstimasi: new Prisma.Decimal(paketLuarKota.hargaEstimasi as unknown as string), 
                      statusPaket: paketLuarKota.statusPaket,
                      pilihTanggal: new Date(paketLuarKota.pilihTanggal),
                      fotoPaketLuar: [], 
                      detailRute: {
                          create: paketLuarKota.detailRute.map(rute => ({
                              ...rute,
                              urutanKe: rute.urutanKe, 
                              namaDestinasi: rute.namaDestinasi,
                              alamatDestinasi: rute.alamatDestinasi,
                              jarakDariSebelumnyaKm: rute.jarakDariSebelumnyaKm,
                              estimasiWaktuTempuh: rute.estimasiWaktuTempuh,
                              waktuKunjunganMenit: rute.waktuKunjunganMenit,
                              deskripsiSingkat: rute.deskripsiSingkat,
                          })),
                      },
                  },
              });
              paketLuarKotaId = createdPaket.paketLuarKotaId;
          } catch (error) {
              console.error('Gagal membuat PaketWisataLuarKota:', error);
              throw new InternalServerErrorException('Gagal membuat data paket luar kota.');
          }
      }

      try {
          return await this.prisma.fasilitas.create({
              data: {
                  jenisFasilitas,
                  namaFasilitas,
                  deskripsi,
                  paketLuarKotaId,
              },
              include: {
                  paketLuarKota: {
                      include: { detailRute: true },
                  },
                  dropoff: true,
                  customRute: true,
              },
          });
      } catch (error) {
          console.error('Gagal membuat Fasilitas:', error);
          throw new InternalServerErrorException('Gagal membuat fasilitas.');
      }
  }

  async findAllFasilitas(): Promise<Fasilitas[]> {
      try {
          return await this.prisma.fasilitas.findMany({
              where: {
                  jenisFasilitas: {
                      in: [JenisFasilitasEnum.PAKET_LUAR_KOTA, JenisFasilitasEnum.CUSTOM],
                  },
              },
              include: {
                  paketLuarKota: {
                      include: { detailRute: true },
                  },
                  dropoff: false,
                  customRute: true,
              },
          });
      } catch (error) {
          throw new InternalServerErrorException('Gagal mengambil data fasilitas.');
      }
  }

  async findOneFasilitas(id: number): Promise<Fasilitas | null> {
      try {
          const fasilitas = await this.prisma.fasilitas.findUnique({
              where: { fasilitasId: id },
              include: {
                  paketLuarKota: {
                      include: { detailRute: true },
                  },
                  dropoff: true,
                  customRute: true,
              },
          });

          if (!fasilitas) {
               throw new NotFoundException(`Fasilitas dengan ID ${id} tidak ditemukan.`);
          }

          return fasilitas;
      } catch (error) {
          if (error instanceof NotFoundException) throw error;
          throw new InternalServerErrorException('Gagal mengambil fasilitas.');
      }
  }

  async updateFasilitas(id: number, updateFasilitasDto: UpdateFasilitasDto): Promise<Fasilitas | null> {
      
      const initialData = await this.prisma.fasilitas.findUnique({
          where: { fasilitasId: id },
          include: { paketLuarKota: true },
      });

      if (!initialData) {
          throw new NotFoundException(`Fasilitas dengan ID ${id} tidak ditemukan.`);
      }

      const { paketLuarKota, ...fasilitasData } = updateFasilitasDto;
      const targetJenisFasilitas = fasilitasData.jenisFasilitas || initialData.jenisFasilitas;
      const paketLuarKotaId = initialData.paketLuarKota?.paketLuarKotaId;

      try {
          const result = await this.prisma.$transaction(async (tx) => {
              
              await tx.fasilitas.update({
                  where: { fasilitasId: id },
                  data: {
                      namaFasilitas: fasilitasData.namaFasilitas,
                      deskripsi: fasilitasData.deskripsi,
                      jenisFasilitas: targetJenisFasilitas,
                     
                  },
              });

              if (targetJenisFasilitas === JenisFasilitasEnum.PAKET_LUAR_KOTA && paketLuarKotaId && paketLuarKota) {
                  
                  if (paketLuarKota.detailRute && paketLuarKota.detailRute.length > 0) {
                      await tx.detailRuteLuarKota.deleteMany({
                          where: { paketLuarKotaId: paketLuarKotaId },
                      });
                      
                      await tx.detailRuteLuarKota.createMany({
                          data: paketLuarKota.detailRute.map(rute => ({
                              ...rute,
                              paketLuarKotaId: paketLuarKotaId,
                              urutanKe: rute.urutanKe, 
                              namaDestinasi: rute.namaDestinasi,
                              alamatDestinasi: rute.alamatDestinasi,
                              jarakDariSebelumnyaKm: rute.jarakDariSebelumnyaKm,
                              estimasiWaktuTempuh: rute.estimasiWaktuTempuh,
                              waktuKunjunganMenit: rute.waktuKunjunganMenit,
                              deskripsiSingkat: rute.deskripsiSingkat,
                          })),
                      });
                  }
                  
                  // b. Update Data Utama Paket Luar Kota
                  await tx.paketWisataLuarKota.update({
                      where: { paketLuarKotaId: paketLuarKotaId },
                      data: {
                          namaPaket: paketLuarKota.namaPaket,
                          tujuanUtama: paketLuarKota.tujuanUtama,
                          totalJarakKm: paketLuarKota.totalJarakKm,
                          estimasiDurasi: paketLuarKota.estimasiDurasi,
                          statusPaket: paketLuarKota.statusPaket,
                          pilihTanggal: new Date(paketLuarKota.pilihTanggal),
                          // Konversi hargaEstimasi string ke Decimal
                          hargaEstimasi: new Prisma.Decimal(paketLuarKota.hargaEstimasi as unknown as string), 
                          // Catatan: Images diurus di endpoint terpisah.
                      },
                  });
              }
              
              // 4. Ambil dan kembalikan data terbaru
              return tx.fasilitas.findUnique({
                  where: { fasilitasId: id },
                  include: {
                      paketLuarKota: { include: { detailRute: true } },
                      dropoff: true,
                      customRute: true,
                  },
              });
          });
          
          return result;
          
      } catch (error) {
          console.error('Error during Fasilitas/Paket Update Transaction:', error);
          
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
              if (error.code === 'P2002') {
                  throw new BadRequestException('Unique constraint failed.');
              }
              // Jika error adalah karena gagal konversi Decimal, ini akan menangkapnya
              if (error.message.includes('Decimal')) {
                  throw new BadRequestException('Gagal konversi harga. Pastikan harga estimasi adalah angka yang valid.');
              }
          }
          
          throw new InternalServerErrorException('Gagal memperbarui fasilitas.');
      }
  }

  async removeFasilitas(id: number): Promise<boolean> {
      try {
          const fasilitas = await this.prisma.fasilitas.findUnique({
              where: { fasilitasId: id },
              select: { jenisFasilitas: true, paketLuarKotaId: true },
          });

          if (!fasilitas) {
              throw new NotFoundException(`Fasilitas dengan ID ${id} tidak ditemukan.`);
          }
          await this.prisma.$transaction(async (tx) => {
              if (fasilitas.jenisFasilitas === JenisFasilitasEnum.PAKET_LUAR_KOTA && fasilitas.paketLuarKotaId) {
                  await tx.paketWisataLuarKota.delete({
                      where: { paketLuarKotaId: fasilitas.paketLuarKotaId },
                  });
              }
              await tx.fasilitas.delete({
                  where: { fasilitasId: id },
              });
          });

          return true;
      } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
               throw new NotFoundException(`Fasilitas dengan ID ${id} tidak ditemukan.`);
          }
          throw new InternalServerErrorException('Gagal menghapus fasilitas.');
      }
  }
}