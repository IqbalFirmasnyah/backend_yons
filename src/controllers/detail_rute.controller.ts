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
  import { DetailRuteService } from 'src/services/detail_rute.service'; 
  import { CreateDetailRuteDto } from '../dto/create_detail_rute.dto'; 
  import { UpdateDetailRuteDto } from '../dto/update_detail_rute.dto'; 
  import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard'; // Import your JwtAuthGuard
  import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiBearerAuth } from '@nestjs/swagger'; // Import Swagger decorators
  
  @ApiTags('Detail Rute') // Add Swagger tag for documentation
  @ApiBearerAuth() // Indicate that this controller uses Bearer token authentication
  @UseGuards(JwtAuthGuard) // Apply JwtAuthGuard to protect all routes in this controller
  @Controller('detail-rute')
  export class DetailRuteController {
    constructor(private readonly detailRuteService: DetailRuteService) {}
  
    @Post('add')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new detail route' }) // Swagger operation summary
    @SwaggerApiResponse({ status: HttpStatus.CREATED, description: 'The detail route has been successfully created.' }) // Swagger response
    @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data or related entities not found.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create detail route.' })
    async create(@Body() createDetailRuteDto: CreateDetailRuteDto) {
      try {
        const rute = await this.detailRuteService.create(createDetailRuteDto);
        return rute;
      } catch (error) {
        console.error('Error creating detail rute:', error);
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        throw new InternalServerErrorException('Failed to create detail rute.');
      }
    }
  
    @Get()
    @ApiOperation({ summary: 'Retrieve all detail routes' })
    @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved all detail routes.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve detail routes.' })
    async findAll() {
      try {
        return await this.detailRuteService.findAll();
      } catch (error) {
        console.error('Error fetching all detail rutes:', error);
        throw new InternalServerErrorException('Failed to retrieve detail rutes.');
      }
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Retrieve a single detail route by ID' })
    @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved the detail route.' })
    @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Detail Rute not found.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve detail route.' })
    async findOne(@Param('id') id: string) {
      try {
        const rute = await this.detailRuteService.findOne(parseInt(id, 10));
        // The service already throws NotFoundException if not found, so we just re-throw it here.
        return rute;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error; 
        }
        console.error(`Error fetching detail rute with ID ${id}:`, error);
        throw new InternalServerErrorException('Failed to retrieve detail rute.');
      }
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update an existing detail route' })
    @SwaggerApiResponse({ status: HttpStatus.OK, description: 'The detail route has been successfully updated.' })
    @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Detail Rute not found.' })
    @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update detail route.' })
    async update(@Param('id') id: string, @Body() updateDetailRuteDto: UpdateDetailRuteDto) {
      try {
        const updatedRute = await this.detailRuteService.update(parseInt(id, 10), updateDetailRuteDto);
        return updatedRute;
      } catch (error) {
        console.error(`Error updating detail rute with ID ${id}:`, error);
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        throw new InternalServerErrorException('Failed to update detail rute.');
      }
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) 
    @ApiOperation({ summary: 'Delete a detail route by ID' })
    @SwaggerApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The detail route has been successfully deleted.' })
    @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Detail Rute not found.' })
    @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to delete detail route.' })
    async remove(@Param('id') id: string) {
      try {
        await this.detailRuteService.remove(parseInt(id, 10));
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error; 
        }
        console.error(`Error deleting detail rute with ID ${id}:`, error);
        throw new InternalServerErrorException('Failed to delete detail rute.');
      }
    }
  }