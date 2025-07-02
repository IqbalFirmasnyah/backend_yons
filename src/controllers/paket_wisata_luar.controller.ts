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
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
  import { PaketWisataLuarKotaService } from 'src/services/paket_wisata_luar.service'; 
  import { CreatePaketWisataLuarKotaDto } from 'src/dto/create_paket_wisata_luar.dto'; 
  import { PaketWisataLuarKotaResponseDto } from 'src/dto/paket_wisata_luar.response.dto';
  import { UpdatePaketWisataLuarKotaDto } from 'src/dto/update_paket_wisata_luar.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
  @ApiTags('Paket Wisata Luar Kota')
  @Controller('paket-wisata-luar-kota')
  @ApiBearerAuth() // Uncomment if using authentication
  @UseGuards(JwtAuthGuard) // Uncomment if using authentication
  export class PaketWisataLuarKotaController {
    constructor(private readonly paketWisataLuarKotaService: PaketWisataLuarKotaService) {}
  
    @Post()
    @ApiOperation({ summary: 'Membuat paket wisata luar kota baru' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Paket wisata luar kota berhasil dibuat',
      type: PaketWisataLuarKotaResponseDto,
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Data tidak valid',
    })
    async create(@Body() createDto: CreatePaketWisataLuarKotaDto) {
      return this.paketWisataLuarKotaService.create(createDto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Mendapatkan daftar paket wisata luar kota' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Nomor halaman' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Jumlah data per halaman' })
    @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter berdasarkan status' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Pencarian berdasarkan nama atau tujuan' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Daftar paket wisata luar kota berhasil diambil',
    })
    async findAll(
      @Query('page') page?: number,
      @Query('limit') limit?: number,
      @Query('status') status?: string,
      @Query('search') search?: string,
    ) {
      if (search) {
        return this.paketWisataLuarKotaService.searchPackages(search);
      }
  
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit;
      const where = status ? { statusPaket: status } : undefined;
  
      return this.paketWisataLuarKotaService.findAll({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
      });
    }
  
    @Get('active')
    @ApiOperation({ summary: 'Mendapatkan paket wisata luar kota yang aktif' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Daftar paket wisata luar kota aktif berhasil diambil',
    })
    async getActivePackages() {
      return this.paketWisataLuarKotaService.getActivePackages();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Mendapatkan detail paket wisata luar kota' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Detail paket wisata luar kota berhasil diambil',
      type: PaketWisataLuarKotaResponseDto,
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Paket wisata luar kota tidak ditemukan',
    })
    async findOne(@Param('id', ParseIntPipe) id: number) {
      return this.paketWisataLuarKotaService.findOne(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Mengupdate paket wisata luar kota' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Paket wisata luar kota berhasil diupdate',
      type: PaketWisataLuarKotaResponseDto,
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Paket wisata luar kota tidak ditemukan',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Data tidak valid',
    })
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateDto: UpdatePaketWisataLuarKotaDto,
    ) {
      return this.paketWisataLuarKotaService.update(id, updateDto);
    }
  
    @Patch(':id/status')
    @ApiOperation({ summary: 'Mengupdate status paket wisata luar kota' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Status paket wisata luar kota berhasil diupdate',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Paket wisata luar kota tidak ditemukan',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Status tidak valid',
    })
    async updateStatus(
      @Param('id', ParseIntPipe) id: number,
      @Body('status') status: string,
    ) {
      return this.paketWisataLuarKotaService.updateStatus(id, status);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Menghapus paket wisata luar kota' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Paket wisata luar kota berhasil dihapus',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Paket wisata luar kota tidak ditemukan',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Tidak dapat menghapus paket yang memiliki booking aktif',
    })
    async remove(@Param('id', ParseIntPipe) id: number) {
      return this.paketWisataLuarKotaService.remove(id);
    }
  }

