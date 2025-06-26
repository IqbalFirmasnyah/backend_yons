import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { PaketWisataLuarKotaService } from '../services/paket_wisata_luar.service';
import { CreatePaketWisataLuarKotaDto } from '../dto/create_paket_wisata_luar.dto';
import { UpdatePaketWisataLuarKotaDto } from '../dto/update_paket_wisata_luar.dto';

@Controller('paket-wisata-luar-kota')
export class PaketWisataLuarKotaController {
  constructor(private readonly paketService: PaketWisataLuarKotaService) {}

  @Post()
  create(@Body() createPaketDto: CreatePaketWisataLuarKotaDto) {
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
  update(@Param('id') id: number, @Body() updatePaketDto: UpdatePaketWisataLuarKotaDto) {
    return this.paketService.update(id, updatePaketDto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.paketService.delete(id);
  }
}
