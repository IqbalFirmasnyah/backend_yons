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
    NotFoundException, 
    InternalServerErrorException, 
    BadRequestException,
    UseGuards // Import UseGuards
  } from '@nestjs/common';
  import { PesananLuarKotaService } from 'src/services/pesanan_luar_kota.service';
  import { CreatePesananLuarKotaDto } from 'src/dto/create_pesanan_luar_kota.dto';
  import { UpdatePesananLuarKotaDto } from 'src/dto/update_pesanan_luar_kota.dto'; 
  import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard'; // Import your JwtAuthGuard
  import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiBearerAuth } from '@nestjs/swagger'; // Import Swagger decorators
  
  @ApiTags('Pesanan Luar Kota') // Add Swagger tag for documentation
  @ApiBearerAuth() // Indicate that this controller uses Bearer token authentication
  @UseGuards(JwtAuthGuard) // Apply JwtAuthGuard to protect all routes in this controller
  @Controller('pesanan-luar-kota')
  export class PesananLuarKotaController {
    constructor(private readonly pesananLuarKotaService: PesananLuarKotaService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new out-of-town order' }) // Swagger operation summary
    @SwaggerApiResponse({ status: HttpStatus.CREATED, description: 'The out-of-town order has been successfully created.' }) // Swagger response
    @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data or related entities not found.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create out-of-town order.' })
    async create(@Body() createPesananLuarKotaDto: CreatePesananLuarKotaDto) {
      try {
        // The service handles all validation for associated IDs and price calculation.
        const pesanan = await this.pesananLuarKotaService.createPesananLuarKota(createPesananLuarKotaDto);
        return pesanan;
      } catch (error) {
        console.error('Error creating pesanan luar kota:', error);
        // Catch specific errors from the service and re-throw them as appropriate HTTP exceptions.
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        // For any other unexpected errors, throw a generic internal server error.
        throw new InternalServerErrorException('Failed to create pesanan luar kota.');
      }
    }
  
    @Get()
    @ApiOperation({ summary: 'Retrieve all out-of-town orders' })
    @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved all out-of-town orders.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve out-of-town orders.' })
    async findAll() {
      try {
        return await this.pesananLuarKotaService.findAllPesananLuarKota();
      } catch (error) {
        console.error('Error fetching all pesanan luar kota:', error);
        // A general error for retrieval failures.
        throw new InternalServerErrorException('Failed to retrieve pesanan luar kota.');
      }
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Retrieve a single out-of-town order by ID' })
    @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved the out-of-town order.' })
    @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Out-of-town order not found.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve out-of-town order.' })
    async findOne(@Param('id') id: string) {
      try {
        const pesanan = await this.pesananLuarKotaService.findOnePesananLuarKota(parseInt(id, 10));
        if (!pesanan) {
          // If the service returns null, it means the ID was not found.
          throw new NotFoundException(`Pesanan Luar Kota with ID ${id} not found.`);
        }
        return pesanan;
      } catch (error) {
        // Re-throw NotFoundException if it came from the service.
        if (error instanceof NotFoundException) {
          throw error;
        }
        console.error(`Error fetching pesanan luar kota with ID ${id}:`, error);
        throw new InternalServerErrorException('Failed to retrieve pesanan luar kota.');
      }
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update an existing out-of-town order' })
    @SwaggerApiResponse({ status: HttpStatus.OK, description: 'The out-of-town order has been successfully updated.' })
    @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Out-of-town order not found.' })
    @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update out-of-town order.' })
    async update(@Param('id') id: string, @Body() updatePesananLuarKotaDto: UpdatePesananLuarKotaDto) {
      try {
        // The service handles ID parsing and update logic.
        const updatedPesanan = await this.pesananLuarKotaService.updatePesananLuarKota(parseInt(id, 10), updatePesananLuarKotaDto);
        if (!updatedPesanan) {
          // If the service returns null, it means the ID to update was not found.
          throw new NotFoundException(`Pesanan Luar Kota with ID ${id} not found.`);
        }
        return updatedPesanan;
      } catch (error) {
        console.error(`Error updating pesanan luar kota with ID ${id}:`, error);
        // Catch specific errors from the service and re-throw them.
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        // For any other unexpected errors during update.
        throw new InternalServerErrorException('Failed to update pesanan luar kota.');
      }
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) // Use 204 No Content for successful deletion
    @ApiOperation({ summary: 'Delete an out-of-town order by ID' })
    @SwaggerApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The out-of-town order has been successfully deleted.' })
    @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Out-of-town order not found.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to delete out-of-town order.' })
    async remove(@Param('id') id: string) {
      try {
        const deleted = await this.pesananLuarKotaService.removePesananLuarKota(parseInt(id, 10));
        if (!deleted) {
          // If the service returns false, the record was not found to delete.
          throw new NotFoundException(`Pesanan Luar Kota with ID ${id} not found.`);
        }
        // No content to return for 204 status.
      } catch (error) {
        // Re-throw NotFoundException if it came from the service.
        if (error instanceof NotFoundException) {
          throw error;
        }
        console.error(`Error deleting pesanan luar kota with ID ${id}:`, error);
        throw new InternalServerErrorException('Failed to delete pesanan luar kota.');
      }
    }
  }