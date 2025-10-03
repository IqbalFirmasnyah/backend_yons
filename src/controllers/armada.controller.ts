import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Put, 
  Delete, 
  UsePipes, 
  ValidationPipe, 
  ParseIntPipe, 
  HttpStatus, 
  HttpCode,
  UseGuards, 
  BadRequestException,
  Query,
  UseInterceptors, // Untuk unggah file
  UploadedFile, // Untuk unggah file
  HttpException, // Untuk error kustom
} from '@nestjs/common';
import { ArmadaService } from 'src/services/armada.service'; 
import { CreateArmadaDto } from '../dto/create_armada.dto';
import { UpdateArmadaDto } from '../dto/update_armada.dto';
import { FotoArmadaDto } from '../dto/foto-armada.dto'; // DTO Foto
import { ApiResponse } from '../interface/api-response.interface';
import { Armada } from '@prisma/client';

// Asumsi path berikut sudah benar:
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard'; 
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse as SwaggerApiResponse, 
    ApiBearerAuth,
    ApiConsumes, // Untuk multipart/form-data
    ApiBody, // Untuk deskripsi body request
} from '@nestjs/swagger'; 
import { FileInterceptor } from '@nestjs/platform-express'; 
import { diskStorage } from 'multer'; 
import * as path from 'path'; // Untuk path
import { Role } from 'src/auth/enums/role.enum';

@ApiTags('Armada') 
@ApiBearerAuth() 
@UseGuards(JwtAuthGuard, RolesGuard) 
@Controller('armada')
@UsePipes(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: true, transform: true }))
export class ArmadaController {
  constructor(private readonly armadaService: ArmadaService) {}
  
  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new armada' }) 
  @SwaggerApiResponse({ status: HttpStatus.CREATED, description: 'The armada has been successfully created.' }) 
  @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' }) 
  async create(@Body() createArmadaDto: CreateArmadaDto): Promise<ApiResponse<Armada>> {
    return this.armadaService.createArmada(createArmadaDto);
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve all armadas' })
  @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved all armadas.' })
  async findAll(): Promise<ApiResponse<Armada[]>> {
    return this.armadaService.findAllArmadas();
  }

  @Get('available-armada')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get available armadas in a date range' })
  @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved available armadas.' })
  @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Start and end dates are required or invalid format.' })
  async availableArmada(
    @Query('start') start: string,
    @Query('end') end: string
  ) {
    if (!start || !end) {
      throw new BadRequestException('Start and end dates are required');
    }
  
    const startDate = new Date(start);
    const endDate = new Date(end);
  
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
  
    const availableArmadas = await this.armadaService.getAvailableArmada(startDate, endDate);
    return {
      message: 'Daftar armada tersedia berhasil diambil',
      data: availableArmadas,
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve a single armada by ID' })
  @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved the armada.' })
  @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Armada not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<Armada>> {
    return this.armadaService.findOneById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update an existing armada' })
  @SwaggerApiResponse({ status: HttpStatus.OK, description: 'The armada has been successfully updated.' })
  @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Armada not found.' })
  @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateArmadaDto: UpdateArmadaDto
  ): Promise<ApiResponse<Armada>> {
    return this.armadaService.updateArmada(id, updateArmadaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete an armada by ID' })
  @SwaggerApiResponse({ status: HttpStatus.OK, description: 'The armada has been successfully deleted.' })
  @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Armada not found.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<null>> {
    return this.armadaService.deleteArmada(id);
  }



  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully uploaded car image',
  })
  @SwaggerApiResponse({
    status: HttpStatus.NOT_ACCEPTABLE,
    description: 'Invalid file type or size',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FotoArmadaDto,
  })
  @UseInterceptors(
    FileInterceptor('image', { // 'image' harus cocok dengan nama field form-data
      storage: diskStorage({
        destination: './public/car-images',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `armada-${uniqueSuffix}${ext}`); // Contoh: armada-1678888888-123456.jpg
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validasi tipe file
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new HttpException(
              {
                message: ['Tipe file tidak valid. Hanya gambar yang diizinkan.'],
                error: 'Not Acceptable',
                statusCode: HttpStatus.NOT_ACCEPTABLE,
              },
              HttpStatus.NOT_ACCEPTABLE,
            ),
            false,
          );
        }
        cb(null, true); // Terima file jika valid
      },
      limits: {
          fileSize: 5 * 1024 * 1024, // Maksimal 5MB (Batas ini juga harus divalidasi manual di fileFilter jika ingin memberikan pesan error spesifik)
      },
    }),
  )
  @Roles(Role.Admin)
  @Post('upload-image/:id')
  public async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new HttpException(
          {
            message: ['Mohon unggah sebuah gambar'],
            error: 'Bad Request',
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
    }
    return await this.armadaService.uploadImage(id, file);
  }
}