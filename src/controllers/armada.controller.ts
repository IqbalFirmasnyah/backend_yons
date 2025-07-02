// src/armada/armada.controller.ts
import { Controller, Post, Get, Body, Param, Put, Delete, UsePipes, ValidationPipe, ParseIntPipe } from '@nestjs/common';
import { ArmadaService } from 'src/services/armada.service'; 
import { CreateArmadaDto } from '../dto/create_armada.dto';
import { UpdateArmadaDto } from '../dto/update_armada.dto';
import { Armada } from '@prisma/client'; // Gunakan type dari Prisma

@Controller('armada')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class ArmadaController {
  constructor(private readonly armadaService: ArmadaService) {}

  @Post()
  async create(@Body() createArmadaDto: CreateArmadaDto): Promise<Armada> {
    return this.armadaService.createArmada(createArmadaDto);
  }

  @Get()
  async findAll(): Promise<Armada[]> {
    return this.armadaService.findAllArmadas();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Armada> {
    return this.armadaService.findOneById(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateArmadaDto: UpdateArmadaDto
  ): Promise<Armada> {
    return this.armadaService.updateArmada(id, updateArmadaDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.armadaService.deleteArmada(id);
  }
}