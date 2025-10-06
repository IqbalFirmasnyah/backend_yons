import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Patch, 
  Delete, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { PaketWisataLuarKotaService } from 'src/services/paket_wisata_luar.service'; 
import { CreatePaketWisataLuarKotaDto } from 'src/dto/create_paket_wisata_luar.dto'; 
import { UpdatePaketWisataLuarKotaDto } from 'src/dto/update_paket_wisata_luar.dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { StatusPaket } from 'src/dto/create_paket_wisata_luar.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Public } from 'src/public/public.decorator';

@ApiTags('Paket Wisata Luar Kota')
@ApiBearerAuth()
@Controller('paket-wisata-luar-kota')
export class PaketWisataLuarKotaController {
  constructor(private readonly paketWisataLuarKotaService: PaketWisataLuarKotaService) {}


  @UseGuards(JwtAuthGuard)
  @Post('upload-images/:id')
  @ApiOperation({ summary: 'Upload multiple images for a paket wisata Luar Kota' })
  @ApiResponse({
      status: 200,
      description: 'Successfully uploaded travel package images',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
      FilesInterceptor('images', 20, { 
          storage: diskStorage({
              destination: './public/package-images', 
              filename: (req, file, cb) => {
                  const uniqueSuffix =
                      Date.now() + '-' + Math.round(Math.random() * 1e9);
                  const fileExtName = path.extname(file.originalname);
                  cb(null, `${file.fieldname}-luar-${uniqueSuffix}${fileExtName}`);
              },
          }),
          fileFilter: (req, file, cb) => {
              if (!file.mimetype.startsWith('image/')) {
                  return cb(
                      new BadRequestException('Invalid file type. Only images are allowed.'),
                      false,
                  );
              }
              cb(null, true);
          },
      }),
  )
  @ApiParam({ name: 'id', type: 'number', description: 'ID Paket Wisata Luar Kota' })
  @ApiBody({
      schema: {
          type: 'object',
          properties: {
              images: {
                  type: 'array',
                  items: {
                      type: 'string',
                      format: 'binary',
                  },
                  description: 'Daftar file gambar paket wisata (Max 20)',
              },
          },
      },
  })
  public async uploadFiles(
      @Param('id', ParseIntPipe) id: number,
      @UploadedFiles() files: Express.Multer.File[],
  ) {
      if (files.length < 1) {
          throw new BadRequestException('Please upload at least one image');
      }
      
      return await this.paketWisataLuarKotaService.uploadImages(id, files);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-image/:id')
  @ApiOperation({ summary: 'Delete a specific image from a paket wisata Luar Kota' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID Paket Wisata Luar Kota' })
  @ApiQuery({ name: 'imageName', type: 'string', description: 'Nama file gambar yang akan dihapus' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Paket wisata or image not found' })
  public async deleteImage(
      @Param('id', ParseIntPipe) id: number,
      @Query('imageName') imageName: string,
  ) {
      if (!imageName) {
          throw new BadRequestException('Image name is required as a query parameter.');
      }
      return await this.paketWisataLuarKotaService.deleteImage(id, imageName);
  }
  @UseGuards(JwtAuthGuard)
  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) createPaketWisataLuarKotaDto: CreatePaketWisataLuarKotaDto) {
    const paket = await this.paketWisataLuarKotaService.createPaketWisataLuarKota(createPaketWisataLuarKotaDto);
    return { statusCode: HttpStatus.CREATED, message: 'Paket wisata luar kota created successfully', data: paket };
  }

  @Get('all')
  @Public() // <-- BIAR BISA DIAKSES GUEST
  async findAll() {
    const paketWisata = await this.paketWisataLuarKotaService.findAllPaketWisataLuarKota();
    return { statusCode: HttpStatus.OK, message: 'Paket wisata luar kota retrieved successfully', data: paketWisata };
  }

  @Get(':id')
  @Public() // <-- opsional, kalau halaman detail ingin publik
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const paket = await this.paketWisataLuarKotaService.findOnePaketWisataLuarKota(id);
    return { statusCode: HttpStatus.OK, message: 'Paket wisata luar kota retrieved successfully', data: paket };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updatePaketWisataLuarKotaDto: UpdatePaketWisataLuarKotaDto) {
    // MEMANGGIL METHOD YANG BENAR DARI SERVICE
    const paket = await this.paketWisataLuarKotaService.updatePaketWisataLuarKota(id, updatePaketWisataLuarKotaDto);
    return { statusCode: HttpStatus.OK, message: 'Paket wisata luar kota updated successfully', data: paket };
  }



// @Patch(':id')
// async update(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updatePaketWisataLuarKotaDto: UpdatePaketWisataLuarKotaDto) {
//   // Tambahkan log ini:
//   console.log('Received Update Payload:', updatePaketWisataLuarKotaDto); 
//   // Pastikan Anda melihat detailRute, hargaEstimasi, dan tanggal di sini.
  
//   const paket = await this.paketWisataLuarKotaService.updatePaketWisataLuarKota(id, updatePaketWisataLuarKotaDto);
//   return { statusCode: HttpStatus.OK, message: 'Paket wisata luar kota updated successfully', data: paket };
// }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status', new ValidationPipe({ transform: true })) status: StatusPaket) {
    
    const paket = await this.paketWisataLuarKotaService.updateStatus(id, status);
    return { statusCode: HttpStatus.OK, message: 'Paket wisata luar kota status updated successfully', data: paket };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    
    await this.paketWisataLuarKotaService.removePaketWisataLuarKota(id);
    return { statusCode: HttpStatus.OK, message: 'Paket wisata luar kota deleted successfully' };
  }
}