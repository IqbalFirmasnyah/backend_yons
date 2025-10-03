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
  UseGuards
} from '@nestjs/common';
import { CustomRuteFasilitasService } from 'src/services/custom-rute-fasilitas.service'; 
import { CreateCustomRuteDto } from 'src/dto/create-custom-rute-fasilitas.dto'; 
import { UpdateCustomRuteDto } from 'src/dto/update-custom-rute-fasilitas.dto'; 
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Custom Rute Fasilitas')
@ApiBearerAuth()
@Controller('custom-rute')
export class CustomRuteFasilitasController {
  constructor(private readonly customRuteFasilitasService: CustomRuteFasilitasService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCustomRuteFasilitasDto: CreateCustomRuteDto) {
    return this.customRuteFasilitasService.createCustomRuteFasilitas(createCustomRuteFasilitasDto);
  }

  @Get()
  async findAll() {
    return this.customRuteFasilitasService.findAllCustomRuteFasilitas();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const customRute = await this.customRuteFasilitasService.findOneCustomRuteFasilitas(parseInt(id, 10));
    if (!customRute) {
      throw new NotFoundException(`Custom Rute Fasilitas with ID ${id} not found.`);
    }
    return customRute;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCustomRuteFasilitasDto: UpdateCustomRuteDto) {
    const updatedCustomRute = await this.customRuteFasilitasService.updateCustomRuteFasilitas(parseInt(id, 10), updateCustomRuteFasilitasDto);
    if (!updatedCustomRute) {
      throw new NotFoundException(`Custom Rute Fasilitas with ID ${id} not found.`);
    }
    return updatedCustomRute;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const deleted = await this.customRuteFasilitasService.removeCustomRuteFasilitas(parseInt(id, 10));
    if (!deleted) {
      throw new NotFoundException(`Custom Rute Fasilitas with ID ${id} not found.`);
    }
  }
}
