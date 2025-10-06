import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaketWisataDto } from '../dto/create_paket_wisata.dto';
import { UpdatePaketWisataDto } from '../dto/update_paket_wisata.dto';
import { PaketWisataQueryDto } from '../dto/paket_wisata_query.dto';
import { PaketWisataResponseDto } from '../dto/paket_wisata_response.dto';
import { Prisma } from '@prisma/client';
import * as fs from 'fs'; // Import File System module

@Injectable()
export class PaketWisataService {
  constructor(private prisma: PrismaService) {}

  public async uploadImages(id: number, files: Express.Multer.File[]) {
    // imagesUploaded berisi array nama file yang sudah disimpan oleh Multer
    const imagesUploaded = files.map((file) => file.filename);

    try {
      // 1. Cek keberadaan paket wisata
      const travelPackage = await this.prisma.paketWisata.findUnique({
        where: { paketId: id },
      });

      if (!travelPackage) {
        // Throw error agar blok catch bisa menghapus file
        throw new NotFoundException('Travel Package not found');
      }

      // 2. Gabungkan daftar gambar baru dengan yang sudah ada
      const newImagesList = travelPackage.images
        ? [...travelPackage.images, ...imagesUploaded]
        : imagesUploaded;

      // 3. Update database
      const updatedPackage = await this.prisma.paketWisata.update({
        where: { paketId: id },
        data: {
          images: newImagesList, // Update kolom images di DB
        },
      });

      // 4. Sukses
      return {
        data: this.mapToResponseDto(updatedPackage),
        message: 'Images uploaded successfully',
      };
    } catch (error) {
      // 5. Rollback File System: Hapus file jika terjadi error database
      if (files.length > 0) {
        for (const file of files) {
          try {
            // Gunakan file.path dari Multer untuk menghapus file yang tersimpan sementara
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
              console.log(`Deleted uploaded file on rollback: ${file.path}`);
            }
          } catch (unlinkError) {
            console.error(`Failed to unlink file during rollback: ${file.path}`, unlinkError);
          }
        }
      }

      // Re-throw the appropriate exception
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Paket wisata with ID ${id} not found`);
      }
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  public async deleteImage(id: number, imageName: string) {
    try {
      const travelPackage = await this.prisma.paketWisata.findUnique({
        where: { paketId: id },
      });

      if (!travelPackage) {
        throw new NotFoundException('Travel Package not found');
      }

      const imageExists = travelPackage.images.includes(imageName);
      if (!imageExists) {
        throw new NotFoundException('Image not found in package list');
      }

      // Path ke file yang akan dihapus. HARUS SESUAI dengan 'destination' di Multer Controller
      const imagePath = `./public/travel-images/${imageName}`; 

      // 1. Hapus dari disk
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`Deleted public image: ${imagePath}`);
      }

      // 2. Hapus dari database (filter array images)
      const updatedImages = travelPackage.images.filter(img => img !== imageName);

      const updatedPackage = await this.prisma.paketWisata.update({
        where: { paketId: id },
        data: { images: updatedImages },
      });

      return {
        data: this.mapToResponseDto(updatedPackage),
        message: 'Image deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        {
          message: [error.message || 'Internal Server Error'],
          error: 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // =========================================================================
  // CRUD Logic (Tetap)
  // =========================================================================

  async create(createPaketWisataDto: CreatePaketWisataDto): Promise<PaketWisataResponseDto> {
    try {
      const paketWisata = await this.prisma.paketWisata.create({
        data: {
          // ... (properti createPaketWisataDto)
          namaPaket: createPaketWisataDto.namaPaket,
          namaTempat: createPaketWisataDto.namaTempat,
          lokasi: createPaketWisataDto.lokasi,
          deskripsi: createPaketWisataDto.deskripsi,
          itinerary: createPaketWisataDto.itinerary,
          jarakKm: createPaketWisataDto.jarakKm,
          durasiHari: createPaketWisataDto.durasiHari,
          pilihTanggal: new Date(createPaketWisataDto.pilihTanggal),
          harga: createPaketWisataDto.harga,
          fotoPaket: createPaketWisataDto.fotoPaket,
          kategori: createPaketWisataDto.kategori,
          statusPaket: createPaketWisataDto.statusPaket || 'aktif',
          images: [], // Inisialisasi array gambar kosong saat membuat paket baru
        },
      });

      return this.mapToResponseDto(paketWisata);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('A package with this name or unique field already exists.');
        }
        throw new BadRequestException(`Failed to create paket wisata: ${error.message}`);
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
              data: {
                  ...updatePaketWisataDto,
                  pilihTanggal: updatePaketWisataDto.pilihTanggal ? new Date(updatePaketWisataDto.pilihTanggal) : existingPaket.pilihTanggal,
              },
          });

          return this.mapToResponseDto(updatedPaket);
      } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
              if (error.code === 'P2025') {
                  throw new NotFoundException(`Paket wisata with ID ${id} not found.`);
              }
              throw new BadRequestException(`Failed to update paket wisata: ${error.message}`);
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
              throw new BadRequestException(`Failed to delete paket wisata: ${error.message}`);
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
              throw new BadRequestException(`Failed to update status: ${error.message}`);
          }
          throw error;
      }
  }

  private mapToResponseDto(paket: any): PaketWisataResponseDto {
      const baseDate = paket.pilihTanggal instanceof Date ? paket.pilihTanggal : new Date(paket.pilihTanggal);

      const tanggalMulaiWisata = baseDate;
      const tanggalSelesaiWisata = new Date(baseDate);
      tanggalSelesaiWisata.setDate(tanggalSelesaiWisata.getDate() + paket.durasiHari);

      return {
          paketId: paket.paketId,
          namaPaket: paket.namaPaket,
          namaTempat: paket.namaTempat,
          lokasi: paket.lokasi,
          deskripsi: paket.deskripsi,
          itinerary: paket.itinerary,
          jarakKm: paket.jarakKm,
          durasiHari: paket.durasiHari,
          pilihTanggal: paket.pilihTanggal,
          harga: Number(paket.harga),
          fotoPaket: paket.fotoPaket,
          images: paket.images || [], 
          kategori: paket.kategori,
          statusPaket: paket.statusPaket,
          createdAt: paket.createdAt,
          updatedAt: paket.updatedAt,
          tanggalMulaiWisata: tanggalMulaiWisata,
          tanggalSelesaiWisata: tanggalSelesaiWisata,
      };
  }
}