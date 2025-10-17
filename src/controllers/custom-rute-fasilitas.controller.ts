// src/controllers/custom-rute-fasilitas.controller.ts
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
  UseGuards,
} from '@nestjs/common';
import { CustomRuteFasilitasService } from 'src/services/custom-rute-fasilitas.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateCustomRuteDto } from 'src/dto/create-custom-rute-fasilitas.dto';
import { UpdateCustomRuteDto } from 'src/dto/update-custom-rute-fasilitas.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';

@ApiTags('Custom Rute Fasilitas')
@ApiBearerAuth()
@Controller('custom-rute')
export class CustomRuteFasilitasController {
  constructor(
    private readonly customRuteFasilitasService: CustomRuteFasilitasService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create custom route fasilitas (single-day)' })
  async create(@Body() createCustomRuteFasilitasDto: CreateCustomRuteDto) {
    return this.customRuteFasilitasService.createCustomRuteFasilitas(
      createCustomRuteFasilitasDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all custom route fasilitas' })
  async findAll() {
    return this.customRuteFasilitasService.findAllCustomRuteFasilitas();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a custom route fasilitas by ID' })
  async findOne(@Param('id') id: string) {
    const customRute =
      await this.customRuteFasilitasService.findOneCustomRuteFasilitas(
        parseInt(id, 10),
      );
    if (!customRute) {
      throw new NotFoundException(`Custom Rute Fasilitas with ID ${id} not found.`);
    }
    return customRute;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update custom route fasilitas (single-day enforced)' })
  async update(
    @Param('id') id: string,
    @Body() updateCustomRuteFasilitasDto: UpdateCustomRuteDto,
  ) {
    const updatedCustomRute =
      await this.customRuteFasilitasService.updateCustomRuteFasilitas(
        parseInt(id, 10),
        updateCustomRuteFasilitasDto,
      );
    if (!updatedCustomRute) {
      throw new NotFoundException(`Custom Rute Fasilitas with ID ${id} not found.`);
    }
    return updatedCustomRute;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom route fasilitas' })
  async remove(@Param('id') id: string) {
    const deleted =
      await this.customRuteFasilitasService.removeCustomRuteFasilitas(
        parseInt(id, 10),
      );
    if (!deleted) {
      throw new NotFoundException(`Custom Rute Fasilitas with ID ${id} not found.`);
    }
  }
}
