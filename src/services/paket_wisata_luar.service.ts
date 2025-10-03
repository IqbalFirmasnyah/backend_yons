import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaketWisataLuarKotaDto } from 'src/dto/create_paket_wisata_luar.dto';
import { UpdatePaketWisataLuarKotaDto } from 'src/dto/update_paket_wisata_luar.dto'; 
import { PaketWisataLuarKotaResponseDto } from 'src/dto/paket_wisata_luar.response.dto'; 
import { PaketWisataLuarKota, DetailRuteLuarKota, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Deklarasi tipe Multer (tetap dipertahankan)
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

@Injectable()
export class PaketWisataLuarKotaService {
  constructor(private prisma: PrismaService) {}

  // =========================================================================
  // FILE MANAGEMENT (UPLOAD & DELETE)
  // =========================================================================

  public async uploadImages(id: number, files: Express.Multer.File[]) {
    const imagesUploaded = files.map((file) => file.filename);

    try {
      // 1. Cek keberadaan paket wisata
      const travelPackage = await this.prisma.paketWisataLuarKota.findUnique({
        where: { paketLuarKotaId: id },
      });

      if (!travelPackage) {
        throw new NotFoundException('Travel Package Luar Kota not found');
      }

      // 2. Gabungkan daftar gambar baru dengan yang sudah ada
      // PERBAIKAN: Menggunakan .fotoPaketLuar (sesuai nama kolom DB)
      const existingImages: string[] = (travelPackage.fotoPaketLuar as string[]) || []; 
      const newImagesList = [...existingImages, ...imagesUploaded];

      // 3. Update database
      const updatedPackage = await this.prisma.paketWisataLuarKota.update({
        where: { paketLuarKotaId: id },
        data: {
          fotoPaketLuar: newImagesList, // Update kolom fotoPaketLuar di DB
        },
        include: { detailRute: true },
      });

      // 4. Sukses
      return {
        data: this.mapToResponseDto(updatedPackage),
        message: 'Images uploaded successfully',
      };
    } catch (error) {
      // 5. Rollback File System
      // ... (Kode rollback tetap sama, sudah benar)
      if (files.length > 0) {
        for (const file of files) {
          try {
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
        throw new NotFoundException(`Paket wisata Luar Kota with ID ${id} not found`);
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
      const travelPackage = await this.prisma.paketWisataLuarKota.findUnique({
        where: { paketLuarKotaId: id },
      });

      if (!travelPackage) {
        throw new NotFoundException('Travel Package Luar Kota not found');
      }

      // PERBAIKAN: Menggunakan .fotoPaketLuar
      const existingImages: string[] = (travelPackage.fotoPaketLuar as string[]) || [];

      const imageExists = existingImages.includes(imageName);
      if (!imageExists) {
        throw new NotFoundException('Image not found in package list');
      }

      // Path ke file yang akan dihapus. HARUS SESUAI dengan 'destination' di Multer Controller
      const imagePath = `./public/package-images/${imageName}`; 

      // 1. Hapus dari disk
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`Deleted public image: ${imagePath}`);
      }

      // 2. Hapus dari database (filter array images)
      const updatedImages = existingImages.filter(img => img !== imageName);

      const updatedPackage = await this.prisma.paketWisataLuarKota.update({
        where: { paketLuarKotaId: id },
        data: { fotoPaketLuar: updatedImages },
        include: { detailRute: true },
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
  // CRUD LOGIC (Tetap dipertahankan, kecuali mapToResponseDto)
  // =========================================================================

  async createPaketWisataLuarKota(dto: CreatePaketWisataLuarKotaDto): Promise<PaketWisataLuarKotaResponseDto> {
    const { detailRute, pilihTanggal, ...paketData } = dto;
    // ... (logic create tetap sama, fotoPaketLuar: [] sudah benar)
    try {
      const paketWisata = await this.prisma.paketWisataLuarKota.create({
        data: {
          ...paketData,
          hargaEstimasi: new Prisma.Decimal(paketData.hargaEstimasi),
          pilihTanggal: new Date(pilihTanggal),
          fotoPaketLuar: [], // Inisialisasi array gambar
          detailRute: {
            createMany: {
              data: detailRute.map(detail => ({
                ...detail,
              })),
            },
          },
        },
        include: {
          detailRute: true,
        },
      });

      return this.mapToResponseDto(paketWisata);
    } catch (error) {
      console.error('Error creating paket wisata luar kota in service:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('A package with this name or unique field already exists.');
        }
        throw new BadRequestException(`Failed to create paket wisata luar kota: ${error.message}`);
      }
      throw error;
    }
  }

  // ... (findAllPaketWisataLuarKota tetap sama)

  async findOnePaketWisataLuarKota(id: number): Promise<PaketWisataLuarKotaResponseDto> {
    const paketWisata = await this.prisma.paketWisataLuarKota.findUnique({
      where: { paketLuarKotaId: id },
      include: {
        detailRute: true,
      },
    });

    if (!paketWisata) {
      throw new NotFoundException(`Paket Wisata Luar Kota with ID ${id} not found`);
    }

    return this.mapToResponseDto(paketWisata);
  }

  async findAllPaketWisataLuarKota(): Promise<PaketWisataLuarKotaResponseDto[]> {

    const paketWisata = await this.prisma.paketWisataLuarKota.findMany({

      include: {

        detailRute: true,

      },

      orderBy: { createdAt: 'desc' },

    });



    return paketWisata.map(paket => this.mapToResponseDto(paket));

  }



  async removePaketWisataLuarKota(id: number): Promise<void> {

    try {

      const existingPaket = await this.prisma.paketWisataLuarKota.findUnique({

        where: { paketLuarKotaId: id },

      });



      if (!existingPaket) {

        throw new NotFoundException(`Paket Wisata Luar Kota with ID ${id} not found`);

      }

      

      // Hapus semua file gambar terkait (tambahan)

      const imagesToDelete: string[] = (existingPaket as any).images || [];

      const imageDir = './public/package-images';



      for (const imageName of imagesToDelete) {

          const imagePath = path.join(imageDir, imageName);

          if (fs.existsSync(imagePath)) {

              fs.unlinkSync(imagePath);

              console.log(`Deleted associated image on package removal: ${imagePath}`);

          }

      }



      await this.prisma.paketWisataLuarKota.delete({

        where: { paketLuarKotaId: id },

      });

    } catch (error) {

      if (error instanceof Prisma.PrismaClientKnownRequestError) {

        if (error.code === 'P2025') {

          throw new NotFoundException(`Paket Wisata Luar Kota with ID ${id} not found.`);

        }

        if (error.code === 'P2003') {

          throw new BadRequestException('Cannot delete paket wisata luar kota. It has related records.');

        }

        throw new BadRequestException(`Failed to delete paket wisata luar kota: ${error.message}`);

      }

      throw error;

    }

  }



  // Method untuk update status paket

  async updateStatus(id: number, status: string): Promise<PaketWisataLuarKotaResponseDto> {

    try {

      const updatedPaket = await this.prisma.paketWisataLuarKota.update({

        where: { paketLuarKotaId: id },

        data: { statusPaket: status },

        include: {

          detailRute: true,

        },

      });



      return this.mapToResponseDto(updatedPaket);

    } catch (error) {

      if (error instanceof Prisma.PrismaClientKnownRequestError) {

        if (error.code === 'P2025') {

          throw new NotFoundException(`Paket Wisata Luar Kota with ID ${id} not found`);

        }

        throw new BadRequestException(`Failed to update status: ${error.message}`);

      }

      throw error;

    }

  }



async updatePaketWisataLuarKota(id: number, dto: UpdatePaketWisataLuarKotaDto): Promise<PaketWisataLuarKotaResponseDto> {

    const { detailRute, pilihTanggal, ...paketData } = dto;



    try {

      const existingPaket = await this.prisma.paketWisataLuarKota.findUnique({

        where: { paketLuarKotaId: id },

      });



      if (!existingPaket) {

        throw new NotFoundException(`Paket Wisata Luar Kota with ID ${id} not found`);

      }



      // Start a transaction for updating the package and its details

      const updatedPaket = await this.prisma.$transaction(async (prisma) => {

        // 1. Update the main PaketWisataLuarKota record

        const updated = await prisma.paketWisataLuarKota.update({

          where: { paketLuarKotaId: id },

          data: {

            ...paketData,

            hargaEstimasi: paketData.hargaEstimasi !== undefined ? new Prisma.Decimal(paketData.hargaEstimasi) : undefined,

            // Convert pilihTanggal to Date if provided

            pilihTanggal: pilihTanggal ? new Date(pilihTanggal) : existingPaket.pilihTanggal,

          },

        });



        // 2. Handle detailRute updates

        if (detailRute && detailRute.length > 0) {

          // Delete existing detail routes

          await prisma.detailRuteLuarKota.deleteMany({

            where: { paketLuarKotaId: id },

          });



          // Create new detail routes

          await prisma.detailRuteLuarKota.createMany({

            data: detailRute.map(detail => ({

              ...detail,

              paketLuarKotaId: id,

            })),

          });

        }



        // Return the updated package with its new detail routes and images

        return await prisma.paketWisataLuarKota.findUnique({

          where: { paketLuarKotaId: id },

          include: {

            detailRute: true,

          },

        });

      });



      return this.mapToResponseDto(updatedPaket);

    } catch (error) {

      if (error instanceof Prisma.PrismaClientKnownRequestError) {

        if (error.code === 'P2025') {

          throw new NotFoundException(`Paket Wisata Luar Kota with ID ${id} not found.`);

        }

        throw new BadRequestException(`Failed to update paket wisata luar kota: ${error.message}`);

      }

      throw error;

    }

  }

  // Private method untuk mapping ke response DTO
  private mapToResponseDto(paket: any): PaketWisataLuarKotaResponseDto {
    const baseDate = paket.pilihTanggal instanceof Date ? paket.pilihTanggal : new Date(paket.pilihTanggal);

    const tanggalMulaiWisata = baseDate;
    const tanggalSelesaiWisata = new Date(baseDate);
    tanggalSelesaiWisata.setDate(tanggalSelesaiWisata.getDate() + paket.estimasiDurasi);

    return {
      paketLuarKotaId: paket.paketLuarKotaId,
      namaPaket: paket.namaPaket,
      tujuanUtama: paket.tujuanUtama,
      totalJarakKm: paket.totalJarakKm,
      estimasiDurasi: paket.estimasiDurasi,
      hargaEstimasi: Number(paket.hargaEstimasi),
      statusPaket: paket.statusPaket,
      pilihTanggal: paket.pilihTanggal, 
      tanggalMulaiWisata: tanggalMulaiWisata,
      tanggalSelesaiWisata: tanggalSelesaiWisata,
      durasi: paket.durasi,
      deskripsi: paket.deskripsi,
      createdAt: paket.createdAt,
      updatedAt: paket.updatedAt,
      detailRute: paket.detailRute || [],
      fotoPaketLuar: paket.fotoPaketLuar || [] 
    };
  }
}