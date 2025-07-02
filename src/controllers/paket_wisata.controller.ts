// src/paket-wisata/paket-wisata.controller.ts
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
  } from '@nestjs/common';
  import { PaketWisataService } from 'src/services/paket_wisata.service'; 
  import { CreatePaketWisataDto } from '../dto/create_paket_wisata.dto';
  import { UpdatePaketWisataDto } from '../dto/update_paket_wisata.dto';
  import { PaketWisataQueryDto } from '../dto/paket_wisata_query.dto';
  import {
    ApiTags,
    ApiResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
  } from '@nestjs/swagger';
  
  @ApiTags('Paket Wisata')
  @Controller('paket-wisata')
  export class PaketWisataController {
    constructor(private readonly paketWisataService: PaketWisataService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create new paket wisata' })
    @ApiResponse({
      status: 201,
      description: 'Paket wisata created successfully',
    })
    @ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    })
    @HttpCode(HttpStatus.CREATED)
    async create(@Body(ValidationPipe) createPaketWisataDto: CreatePaketWisataDto) {
      const paket = await this.paketWisataService.create(createPaketWisataDto);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Paket wisata created successfully',
        data: paket,
      };
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all paket wisata with filtering and pagination' })
    @ApiQuery({ name: 'kategori', required: false, enum: ['dalam_kota', 'luar_kota'] })
    @ApiQuery({ name: 'status', required: false, enum: ['aktif', 'non_aktif'] })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({
      status: 200,
      description: 'List of paket wisata retrieved successfully',
    })
    async findAll(@Query(ValidationPipe) query: PaketWisataQueryDto) {
      const result = await this.paketWisataService.findAll(query);
      return {
        statusCode: HttpStatus.OK,
        message: 'Paket wisata retrieved successfully',
        ...result,
      };
    }
  
    @Get('kategori/:kategori')
    @ApiOperation({ summary: 'Get paket wisata by kategori' })
    @ApiParam({ name: 'kategori', enum: ['dalam_kota', 'luar_kota'] })
    @ApiResponse({
      status: 200,
      description: 'Paket wisata by kategori retrieved successfully',
    })
    async findByKategori(@Param('kategori') kategori: string) {
      const paketWisata = await this.paketWisataService.findByKategori(kategori);
      return {
        statusCode: HttpStatus.OK,
        message: `Paket wisata kategori ${kategori} retrieved successfully`,
        data: paketWisata,
      };
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get paket wisata by ID' })
    @ApiParam({ name: 'id', type: 'number' })
    @ApiResponse({
      status: 200,
      description: 'Paket wisata retrieved successfully',
    })
    @ApiResponse({
      status: 404,
      description: 'Paket wisata not found',
    })
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
    @ApiResponse({
      status: 200,
      description: 'Paket wisata updated successfully',
    })
    @ApiResponse({
      status: 404,
      description: 'Paket wisata not found',
    })
    @ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    })
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
    @ApiResponse({
      status: 200,
      description: 'Paket wisata status updated successfully',
    })
    @ApiResponse({
      status: 404,
      description: 'Paket wisata not found',
    })
    async updateStatus(
      @Param('id', ParseIntPipe) id: number,
      @Body('status') status: string,
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
    @ApiResponse({
      status: 200,
      description: 'Paket wisata deleted successfully',
    })
    @ApiResponse({
      status: 404,
      description: 'Paket wisata not found',
    })
    @ApiResponse({
      status: 400,
      description: 'Cannot delete paket wisata with related records',
    })
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id', ParseIntPipe) id: number) {
      await this.paketWisataService.remove(id);
      return {
        statusCode: HttpStatus.OK,
        message: 'Paket wisata deleted successfully',
      };
    }
  }