import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { PaketWisataService } from 'src/services/paket_wisata.service';
import { CreatePaketWisataDto } from '../dto/create_paket_wisata.dto';
import { UpdatePaketWisataDto } from '../dto/update_paket_wisata.dto';
import { PaketWisataQueryDto } from '../dto/paket_wisata_query.dto';
import { PaketWisataResponseDto } from '../dto/paket_wisata_response.dto';
import { KategoriPaket, StatusPaket } from '../dto/create_paket_wisata.dto';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes, // Diperlukan untuk upload file
  ApiBody, // Diperlukan untuk mendeskripsikan body multipart/form-data
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
import { Public } from 'src/public/public.decorator';

// Import Multer dan path
import { diskStorage } from 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as path from 'path';

@ApiTags('Paket Wisata')
@ApiBearerAuth()
@Controller('paket-wisata')
@UseGuards(JwtAuthGuard) // Guard diterapkan secara global di controller (kecuali Public)
export class PaketWisataController {
  constructor(private readonly paketWisataService: PaketWisataService) {}

  // =========================================================================
  // CRUD Endpoints (Tidak dimodifikasi)
  // =========================================================================

  @Post('add')
  @ApiOperation({ summary: 'Create new paket wisata' })
  @ApiResponse({ status: 201, description: 'Paket wisata created successfully', type: PaketWisataResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) createPaketWisataDto: CreatePaketWisataDto) {
    const paket = await this.paketWisataService.create(createPaketWisataDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Paket wisata created successfully',
      data: paket,
    };
  }

  @Get('all')
  @Public()
  @ApiOperation({ summary: 'Get all paket wisata with filtering and pagination' })
  @ApiQuery({ name: 'kategori', required: false, enum: KategoriPaket })
  @ApiQuery({ name: 'status', required: false, enum: StatusPaket })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of paket wisata retrieved successfully', type: [PaketWisataResponseDto] })
  async findAll(@Query(new ValidationPipe({ transform: true, transformOptions: { enableImplicitConversion: true } })) query: PaketWisataQueryDto) {
    const result = await this.paketWisataService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Paket wisata retrieved successfully',
      ...result,
    };
  }

  @Get('kategori/:kategori')
  @Public()
  @ApiOperation({ summary: 'Get paket wisata by kategori' })
  @ApiParam({ name: 'kategori', enum: KategoriPaket })
  @ApiResponse({ status: 200, description: 'Paket wisata by kategori retrieved successfully', type: [PaketWisataResponseDto] })
  async findByKategori(@Param('kategori') kategori: KategoriPaket) {
    const paketWisata = await this.paketWisataService.findByKategori(kategori);
    return {
      statusCode: HttpStatus.OK,
      message: `Paket wisata kategori ${kategori} retrieved successfully`,
      data: paketWisata,
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get paket wisata by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Paket wisata retrieved successfully', type: PaketWisataResponseDto })
  @ApiResponse({ status: 404, description: 'Paket wisata not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const paket = await this.paketWisataService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Paket wisata retrieved successfully',
      data: paket,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update paket wisata' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Paket wisata updated successfully', type: PaketWisataResponseDto })
  @ApiResponse({ status: 404, description: 'Paket wisata not found' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updatePaketWisataDto: UpdatePaketWisataDto,
  ) {
    const paket = await this.paketWisataService.update(id, updatePaketWisataDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Paket wisata updated successfully',
      data: paket,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update paket wisata status' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Paket wisata status updated successfully', type: PaketWisataResponseDto })
  @ApiResponse({ status: 404, description: 'Paket wisata not found' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status', new ValidationPipe({ transform: true })) status: StatusPaket,
  ) {
    const paket = await this.paketWisataService.updateStatus(id, status);
    return {
      statusCode: HttpStatus.OK,
      message: 'Paket wisata status updated successfully',
      data: paket,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete paket wisata' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Paket wisata deleted successfully' })
  @ApiResponse({ status: 404, description: 'Paket wisata not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete paket wisata with related records' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.paketWisataService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Paket wisata deleted successfully',
    };
  }

  // =========================================================================
  // File Upload Endpoints (BARU)
  // =========================================================================

  @Post('upload-images/:id')
  @ApiOperation({ summary: 'Upload multiple images for a paket wisata' })
  @ApiResponse({
    status: 200,
    description: 'Successfully uploaded travel package images',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', 20, { // 'images' adalah nama field di form-data
      storage: diskStorage({
        // Sesuaikan path destinasi ini dengan struktur project Anda
        destination: './public/travel-images',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExtName = path.extname(file.originalname);
          // Simpan nama file dengan ekstensi asli
          cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtName}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validasi tipe file
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new HttpException(
              'Invalid file type. Only images are allowed.',
              HttpStatus.NOT_ACCEPTABLE,
            ),
            false,
          );
        }
        cb(null, true); // Terima file jika valid
      },
    }),
  )
  @ApiParam({ name: 'id', type: 'number', description: 'ID Paket Wisata' })
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
    // Validasi di sini hanya untuk memastikan ada file. Validasi lainnya di interceptor.
    if (files.length < 1) {
      throw new BadRequestException('Please upload at least one image');
    }
    
    // Panggil service untuk menyimpan nama file ke database
    return await this.paketWisataService.uploadImages(id, files);
  }

  @Delete('delete-image/:id')
  @ApiOperation({ summary: 'Delete a specific image from a paket wisata' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID Paket Wisata' })
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
    return await this.paketWisataService.deleteImage(id, imageName);
  }
}