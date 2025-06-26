import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { PaketWisataService } from '../services/paket_wisata.service';
import { CreatePaketWisataDto } from '../dto/create_paket_wisata.dto';
import { UpdatePaketWisataDto } from '../dto/update_paket_wisata.dto';

@Controller('paket-wisata')
export class PaketWisataController {
  constructor(private readonly paketService: PaketWisataService) {}

  @Post()
  create(@Body() createPaketDto: CreatePaketWisataDto) {
    return this.paketService.create(createPaketDto);
  }

  @Get()
  findAll() {
    return this.paketService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.paketService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updatePaketDto: UpdatePaketWisataDto) {
    return this.paketService.update(id, updatePaketDto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.paketService.delete(id);
  }
}
