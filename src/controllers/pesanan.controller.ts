// pesanan.controller.ts
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
    UseGuards,
    HttpCode
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
    ApiBody
  } from '@nestjs/swagger';
  import { PesananService } from 'src/services/pesanan.service'; 
  import { CreatePesananDto } from '../dto/create_pesanan.dto';
  import { UpdatePesananDto } from '../dto/update_pesanan.dto';
  import { QueryPesananDto } from '../dto/query_pesanan.dto';
  import { PesananResponseDto } from '../dto/pesanan_response.dto';
  
  @ApiTags('Pesanan')
  @Controller('pesanan')
  // @UseGuards(JwtAuthGuard) // Uncomment jika menggunakan JWT auth
  // @ApiBearerAuth()
  export class PesananController {
    constructor(private readonly pesananService: PesananService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Membuat pesanan baru' })
    @ApiBody({ type: CreatePesananDto })
    @ApiResponse({
      status: 201,
      description: 'Pesanan berhasil dibuat',
      type: PesananResponseDto
    })
    @ApiResponse({
      status: 400,
      description: 'Data tidak valid atau konflik jadwal'
    })
    @ApiResponse({
      status: 404,
      description: 'User, paket, supir, atau armada tidak ditemukan'
    })
    async create(@Body() createPesananDto: CreatePesananDto): Promise<PesananResponseDto> {
      return this.pesananService.create(createPesananDto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Mendapatkan daftar pesanan dengan filter dan pagination' })
    @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Filter berdasarkan user ID' })
    @ApiQuery({ name: 'statusPesanan', required: false, enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'], description: 'Filter berdasarkan status' })
    @ApiQuery({ name: 'tanggalMulaiDari', required: false, type: String, description: 'Filter tanggal mulai dari (YYYY-MM-DD)' })
    @ApiQuery({ name: 'tanggalMulaiSampai', required: false, type: String, description: 'Filter tanggal mulai sampai (YYYY-MM-DD)' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Halaman (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Jumlah data per halaman (default: 10)' })
    @ApiResponse({
      status: 200,
      description: 'Daftar pesanan berhasil diambil',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/PesananResponseDto' }
          },
          total: { type: 'number' },
          page: { type: 'number' },
          limit: { type: 'number' }
        }
      }
    })
    async findAll(@Query() query: QueryPesananDto) {
      return this.pesananService.findAll(query);
    }
  
    @Get('statistics')
    @ApiOperation({ summary: 'Mendapatkan statistik pesanan' })
    @ApiResponse({
      status: 200,
      description: 'Statistik pesanan berhasil diambil',
      schema: {
        type: 'object',
        properties: {
          totalPesanan: { type: 'number' },
          statusBreakdown: {
            type: 'object',
            properties: {
              pending: { type: 'number' },
              confirmed: { type: 'number' },
              ongoing: { type: 'number' },
              completed: { type: 'number' },
              cancelled: { type: 'number' }
            }
          },
          totalRevenue: { type: 'number' }
        }
      }
    })
    async getStatistics() {
      return this.pesananService.getStatistics();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Mendapatkan detail pesanan berdasarkan ID' })
    @ApiParam({ name: 'id', type: 'number', description: 'ID pesanan' })
    @ApiResponse({
      status: 200,
      description: 'Detail pesanan berhasil diambil',
      type: PesananResponseDto
    })
    @ApiResponse({
      status: 404,
      description: 'Pesanan tidak ditemukan'
    })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<PesananResponseDto> {
      return this.pesananService.findOne(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Memperbarui pesanan' })
    @ApiParam({ name: 'id', type: 'number', description: 'ID pesanan' })
    @ApiBody({ type: UpdatePesananDto })
    @ApiResponse({
      status: 200,
      description: 'Pesanan berhasil diperbarui',
      type: PesananResponseDto
    })
    @ApiResponse({
      status: 400,
      description: 'Data tidak valid atau transisi status tidak diizinkan'
    })
    @ApiResponse({
      status: 404,
      description: 'Pesanan tidak ditemukan'
    })
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updatePesananDto: UpdatePesananDto
    ): Promise<PesananResponseDto> {
      return this.pesananService.update(id, updatePesananDto);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Menghapus pesanan' })
    @ApiParam({ name: 'id', type: 'number', description: 'ID pesanan' })
    @ApiResponse({
      status: 200,
      description: 'Pesanan berhasil dihapus',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      }
    })
    @ApiResponse({
      status: 400,
      description: 'Tidak dapat menghapus pesanan yang sedang berlangsung'
    })
    @ApiResponse({
      status: 404,
      description: 'Pesanan tidak ditemukan'
    })
    async remove(@Param('id', ParseIntPipe) id: number) {
      return this.pesananService.remove(id);
    }
  
    @Patch(':id/status')
    @ApiOperation({ summary: 'Mengubah status pesanan' })
    @ApiParam({ name: 'id', type: 'number', description: 'ID pesanan' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          statusPesanan: {
            type: 'string',
            enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled']
          }
        },
        required: ['statusPesanan']
      }
    })
    @ApiResponse({
      status: 200,
      description: 'Status pesanan berhasil diubah',
      type: PesananResponseDto
    })
    @ApiResponse({
      status: 400,
      description: 'Transisi status tidak diizinkan'
    })
    @ApiResponse({
      status: 404,
      description: 'Pesanan tidak ditemukan'
    })
    async updateStatus(
      @Param('id', ParseIntPipe) id: number,
      @Body('statusPesanan') statusPesanan: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled'
    ): Promise<PesananResponseDto> {
      return this.pesananService.update(id, { statusPesanan });
    }
  
    @Get('user/:userId')
    @ApiOperation({ summary: 'Mendapatkan pesanan berdasarkan user ID' })
    @ApiParam({ name: 'userId', type: 'number', description: 'ID user' })
    @ApiQuery({ name: 'statusPesanan', required: false, enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'] })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Halaman (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Jumlah data per halaman (default: 10)' })
    @ApiResponse({
      status: 200,
      description: 'Daftar pesanan user berhasil diambil'
    })
    async findByUser(
      @Param('userId', ParseIntPipe) userId: number,
      @Query() query: Omit<QueryPesananDto, 'userId'>
    ) {
      return this.pesananService.findAll({ ...query, userId });
    }
  }