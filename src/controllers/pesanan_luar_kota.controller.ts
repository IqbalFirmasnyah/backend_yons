import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { PesananLuarKotaService } from '../services/pesanan_luar_kota.service';
import { CreatePesananLuarKotaDto } from '../dto/create_pesanan_luar_kota.dto';
import { UpdatePesananLuarKotaDto } from '../dto/update_pesanan_luar_kota.dto';

@Controller('pesanan-luar-kota')
export class PesananLuarKotaController {
  constructor(private readonly pesananService: PesananLuarKotaService) {}

  @Post()
  create(@Body() createPesananDto: CreatePesananLuarKotaDto) {
    return this.pesananService.create(createPesananDto);
  }

  @Get()
  findAll() {
    return this.pesananService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.pesananService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updatePesananDto: UpdatePesananLuarKotaDto) {
    return this.pesananService.update(id, updatePesananDto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.pesananService.delete(id);
  }
}
