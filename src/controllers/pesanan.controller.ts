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
  import { PesananService } from 'src/services/pesanan.service'; 
  import { CreatePesananDto } from '../dto/create_pesanan.dto'; // Adjust path
  import { UpdatePesananDto } from '../dto/update_pesanan.dto'; // Adjust path
  import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard'; // Import your JwtAuthGuard
  import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiBearerAuth } from '@nestjs/swagger'; // Import Swagger decorators
  
  @ApiTags('Pesanan') // Add Swagger tag for documentation
  @ApiBearerAuth() // Indicate that this controller uses Bearer token authentication
  @UseGuards(JwtAuthGuard) // Apply JwtAuthGuard to protect all routes in this controller
  @Controller('pesanan')
  export class PesananController {
    constructor(private readonly pesananService: PesananService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new order' }) // Swagger operation summary
    @SwaggerApiResponse({ status: HttpStatus.CREATED, description: 'The order has been successfully created.' }) // Swagger response
    @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data or related entities not found.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create order.' })
    async create(@Body() createPesananDto: CreatePesananDto) {
      try {
        const pesanan = await this.pesananService.createPesanan(createPesananDto);
        return pesanan;
      } catch (error) {
        console.error('Error creating pesanan:', error);
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        throw new InternalServerErrorException('Failed to create pesanan.');
      }
    }
  
    @Get()
    @ApiOperation({ summary: 'Retrieve all orders' })
    @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved all orders.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve orders.' })
    async findAll() {
      try {
        return await this.pesananService.findAllPesanan();
      } catch (error) {
        console.error('Error fetching all pesanan:', error);
        throw new InternalServerErrorException('Failed to retrieve pesanan.');
      }
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Retrieve a single order by ID' })
    @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved the order.' })
    @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Order not found.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve order.' })
    async findOne(@Param('id') id: string) {
      try {
        const pesanan = await this.pesananService.findOnePesanan(parseInt(id, 10));
        if (!pesanan) {
          throw new NotFoundException(`Pesanan with ID ${id} not found.`);
        }
        return pesanan;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        console.error(`Error fetching pesanan with ID ${id}:`, error);
        throw new InternalServerErrorException('Failed to retrieve pesanan.');
      }
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update an existing order' })
    @SwaggerApiResponse({ status: HttpStatus.OK, description: 'The order has been successfully updated.' })
    @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Order not found.' })
    @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update order.' })
    async update(@Param('id') id: string, @Body() updatePesananDto: UpdatePesananDto) {
      try {
        const updatedPesanan = await this.pesananService.updatePesanan(parseInt(id, 10), updatePesananDto);
        if (!updatedPesanan) {
          throw new NotFoundException(`Pesanan with ID ${id} not found.`);
        }
        return updatedPesanan;
      } catch (error) {
        console.error(`Error updating pesanan with ID ${id}:`, error);
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        throw new InternalServerErrorException('Failed to update pesanan.');
      }
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an order by ID' })
    @SwaggerApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The order has been successfully deleted.' })
    @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Order not found.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to delete order.' })
    async remove(@Param('id') id: string) {
      try {
        const deleted = await this.pesananService.removePesanan(parseInt(id, 10));
        if (!deleted) {
          throw new NotFoundException(`Pesanan with ID ${id} not found.`);
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        console.error(`Error deleting pesanan with ID ${id}:`, error);
        throw new InternalServerErrorException('Failed to delete pesanan.');
      }
    }
  }