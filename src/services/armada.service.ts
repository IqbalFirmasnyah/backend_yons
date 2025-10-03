import { 
  Injectable, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArmadaDto } from '../dto/create_armada.dto';
import { UpdateArmadaDto } from '../dto/update_armada.dto';
import { ApiResponse } from '../interface/api-response.interface';
import { Armada } from '@prisma/client';
import * as fs from 'fs'; // Node.js File System
import * as path from 'path'; // Node.js Path

// Deklarasi tipe global untuk Multer File
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
export class ArmadaService {
  constructor(private readonly prisma: PrismaService) {}

  // --- CRUD Dasar ---

  async createArmada(createArmadaDto: CreateArmadaDto): Promise<ApiResponse<Armada>> {
    try {
      const armada = await this.prisma.armada.create({
        data: createArmadaDto,
      });

      return {
        success: true,
        message: 'Armada berhasil ditambahkan',
        data: armada
      };
    } catch (error) {
      // Dalam konteks praktik terbaik, sebaiknya gunakan HttpException di Controller
      // Namun, menyesuaikan dengan struktur respons Anda:
      return {
        success: false,
        message: 'Gagal menambahkan armada: ' + error.message
      };
    }
  }

  async findAllArmadas(): Promise<ApiResponse<Armada[]>> {
    try {
      const armadas = await this.prisma.armada.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        message: armadas.length > 0 ? 
          `Berhasil mengambil ${armadas.length} data armada` : 
          'Tidak ada data armada yang ditemukan',
        data: armadas
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal mengambil data armada: ' + error.message
      };
    }
  }

  async findOneById(armadaId: number): Promise<ApiResponse<Armada>> {
    try {
      const armada = await this.prisma.armada.findUnique({
        where: { armadaId },
      });
      
      if (!armada) {
        return {
          success: false,
          message: `Armada dengan ID ${armadaId} tidak ditemukan`
        };
      }
      
      return {
        success: true,
        message: 'Armada berhasil ditemukan',
        data: armada
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal mencari armada: ' + error.message
      };
    }
  }

  async updateArmada(armadaId: number, updateArmadaDto: UpdateArmadaDto): Promise<ApiResponse<Armada>> {
    try {
      const existingArmada = await this.prisma.armada.findUnique({
        where: { armadaId }
      });

      if (!existingArmada) {
        return {
          success: false,
          message: `Armada dengan ID ${armadaId} tidak ditemukan`
        };
      }

      const updatedArmada = await this.prisma.armada.update({
        where: { armadaId },
        data: updateArmadaDto,
      });

      return {
        success: true,
        message: 'Armada berhasil diperbarui',
        data: updatedArmada
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal memperbarui armada: ' + error.message
      };
    }
  }

  async deleteArmada(armadaId: number): Promise<ApiResponse<null>> {
    try {
      const existingArmada = await this.prisma.armada.findUnique({
        where: { armadaId }
      });

      if (!existingArmada) {
        return {
          success: false,
          message: `Armada dengan ID ${armadaId} tidak ditemukan`
        };
      }
      
      // Hapus file gambar terkait jika ada
      if (existingArmada.fotoArmada) {
        const uploadDir = './public/car-images'; 
        const imagePath = path.join(uploadDir, existingArmada.fotoArmada);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`Deleted associated image: ${imagePath}`);
        }
      }

      await this.prisma.armada.delete({
        where: { armadaId },
      });

      return {
        success: true,
        message: 'Armada berhasil dihapus'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal menghapus armada: ' + error.message
      };
    }
  }

  async getAvailableArmada(start: Date, end: Date) {
    return this.prisma.armada.findMany({
      where: {
        statusArmada: "tersedia", 
        NOT: {
          booking: {
            some: {
              statusBooking: {
                in: ["pending_payment", "payment_verified", "confirmed"], 
              },
              tanggalMulaiWisata: { lte: end },
              tanggalSelesaiWisata: { gte: start },
            },
          },
        },
      },
    });
  }

  // --- Fungsionalitas Unggah Foto ---

  public async uploadImage(armadaId: number, image: Express.Multer.File): Promise<ApiResponse<Armada>> {
    try {
      // 1. Cari Armada
      const armada = await this.prisma.armada.findUnique({
        where: { armadaId },
      });

      if (!armada) {
        // Hapus file yang sudah terunggah di folder temp (Multer) karena armada tidak ditemukan
        if (image && fs.existsSync(image.path)) {
            fs.unlinkSync(image.path);
        }
        throw new HttpException(
          {
            message: ['Armada tidak ditemukan'],
            error: 'Not Found',
            statusCode: HttpStatus.NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // 2. Hapus gambar lama (jika ada)
      const uploadDir = './public/car-images'; 
      if (armada.fotoArmada) {
        const oldImagePath = path.join(uploadDir, armada.fotoArmada);
        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log(`Deleted old image: ${oldImagePath}`);
        }
      }

      // 3. Update data armada dengan nama file baru
      const updatedArmada = await this.prisma.armada.update({
        where: { armadaId },
        data: {
          fotoArmada: image.filename,
        },
      });

      // 4. Sukses
      return {
        success: true,
        message: 'Foto armada berhasil diunggah',
        data: updatedArmada,
      };
    } catch (error) {
      // 5. Rollback file: Hapus file baru yang sudah terunggah jika terjadi kegagalan UPDATE database.
      if (image && fs.existsSync(image.path)) {
        fs.unlinkSync(image.path);
        console.log(`Rollback: Deleted uploaded file: ${image.path}`);
      }
      
      if (error instanceof HttpException) {
        throw error;
      }

      // Menangani error umum
      throw new HttpException(
        {
          message: [error.message || 'Gagal mengunggah foto armada'],
          error: error.message || 'Internal Server Error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}