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
  UseGuards 
} from '@nestjs/common';
import { FasilitasService } from 'src/services/fasilitas.service';
import { CreateFasilitasDto } from 'src/dto/create-fasilitas.dto';
import { UpdateFasilitasDto } from 'src/dto/update-fasilitas.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Fasilitas')
@Controller('fasilitas')
export class FasilitasController {
  constructor(private readonly fasilitasService: FasilitasService) {}

  // 🔒 hanya admin/user login yang bisa buat fasilitas
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new facility' })
  @SwaggerApiResponse({ status: HttpStatus.CREATED, description: 'The facility has been successfully created.' })
  @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create facility.' })
  async create(@Body() createFasilitasDto: CreateFasilitasDto) {
    try {
      return await this.fasilitasService.createFasilitas(createFasilitasDto);
    } catch (error) {
      console.error('Error creating fasilitas:', error);
      throw new InternalServerErrorException('Failed to create fasilitas.');
    }
  }

  
  @Get()
  @ApiOperation({ summary: 'Retrieve all facilities (Public)' })
  @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved all facilities.' })
  @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve facilities.' })
  async findAll() {
    try {
      const fasilitas = await this.fasilitasService.findAllFasilitas();
      return {
        statusCode: HttpStatus.OK,
        message: 'Facilities retrieved successfully',
        data: fasilitas,
      };
    } catch (error) {
      console.error('Error fetching all fasilitas:', error);
      throw new InternalServerErrorException('Failed to retrieve fasilitas.');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single facility by ID (Public)' })
  @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved the facility.' })
  @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Facility not found.' })
  @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve facility.' })
  async findOne(@Param('id') id: string) {
    try {
      const fasilitas = await this.fasilitasService.findOneFasilitas(parseInt(id, 10));
      if (!fasilitas) {
        throw new NotFoundException(`Fasilitas with ID ${id} not found.`);
      }
      return fasilitas;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching fasilitas with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to retrieve fasilitas.');
    }
  }

  // 🔒 hanya login bisa update
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing facility' })
  @SwaggerApiResponse({ status: HttpStatus.OK, description: 'The facility has been successfully updated.' })
  @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Facility not found.' })
  @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update facility.' })
  async update(@Param('id') id: string, @Body() updateFasilitasDto: UpdateFasilitasDto) {
    try {
      const updatedFasilitas = await this.fasilitasService.updateFasilitas(parseInt(id, 10), updateFasilitasDto);
      if (!updatedFasilitas) {
        throw new NotFoundException(`Fasilitas with ID ${id} not found.`);
      }
      return updatedFasilitas;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error updating fasilitas with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to update fasilitas.');
    }
  }

  // 🔒 hanya login bisa delete
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a facility by ID' })
  @SwaggerApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The facility has been successfully deleted.' })
  @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Facility not found.' })
  @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to delete facility.' })
  async remove(@Param('id') id: string) {
    try {
      const deleted = await this.fasilitasService.removeFasilitas(parseInt(id, 10));
      if (!deleted) {
        throw new NotFoundException(`Fasilitas with ID ${id} not found.`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error deleting fasilitas with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete fasilitas.');
    }
  }
}
