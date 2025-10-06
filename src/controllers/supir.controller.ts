import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards, // Import UseGuards
  ParseIntPipe, // Import ParseIntPipe for robust ID parsing
  HttpStatus, // Import HttpStatus for explicit status codes
  HttpCode, // Import HttpCode for explicit status codes
  BadRequestException,
  Query,
} from '@nestjs/common';
import { SupirService } from '../services/supir.service';
import { CreateSupirDto } from '../dto/create_supir.dto';
import { UpdateSupirDto } from '../dto/update_supir.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard'; // Import your JwtAuthGuard
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'; 
import { Public } from 'src/public/public.decorator';

@ApiTags('Supir') // Add Swagger tag for documentation
@ApiBearerAuth() // Indicate that this controller uses Bearer token authentication
@UseGuards(JwtAuthGuard) // Apply JwtAuthGuard to protect all routes in this controller
@Controller('supir')
export class SupirController {
  constructor(private readonly supirService: SupirService) {}

  @Post('add')
  @HttpCode(HttpStatus.CREATED) // Explicitly set 201 Created status
  @ApiOperation({ summary: 'Create a new driver' }) // Swagger operation summary
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'The driver has been successfully created.',
  }) // Swagger response
  @SwaggerApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async create(@Body() createSupirDto: CreateSupirDto) {
    const data = await this.supirService.create(createSupirDto);
    return {
      message: 'Supir berhasil ditambahkan',
      data,
    };
  }

  @Get('available-supir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve available drivers for a given date range',
  })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved available drivers.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid date range.',
  })
  async availableSupir(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    // Validasi sederhana: pastikan query ada
    if (!start || !end) {
      throw new BadRequestException('Start and end dates are required');
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Bisa ditambahkan validasi jika tanggal tidak valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const availableSupirs = await this.supirService.getAvailableSupir(
      startDate,
      endDate,
    );

    return {
      message: 'Daftar supir tersedia berhasil diambil',
      data: availableSupirs,
    };
  }

  @Get('all')
  @Public() // <-- BIAR BISA DIAKSES GUEST
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve all drivers' })
  async findAll() {
    const data = await this.supirService.findAll();
    return { message: 'Daftar supir berhasil diambil', data };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK) // Explicitly set 200 OK status
  @ApiOperation({ summary: 'Retrieve a single driver by ID' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID of the driver to retrieve',
  })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the driver.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Driver not found.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    // Use ParseIntPipe for ID validation
    const data = await this.supirService.findOne(id);
    return {
      message: 'Detail supir ditemukan',
      data,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK) // Explicitly set 200 OK status
  @ApiOperation({ summary: 'Update an existing driver' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID of the driver to update',
  })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'The driver has been successfully updated.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Driver not found.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupirDto: UpdateSupirDto,
  ) {
    // Use ParseIntPipe
    const data = await this.supirService.update(id, updateSupirDto);
    return {
      message: 'Data supir berhasil diperbarui',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK) // Explicitly set 200 OK status for successful deletion
  @ApiOperation({ summary: 'Delete a driver by ID' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID of the driver to delete',
  })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'The driver has been successfully deleted.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Driver not found.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    // Use ParseIntPipe
    await this.supirService.delete(id);
    return {
      message: 'Supir berhasil dihapus',
    };
  }
}
