import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { PesananService } from '../services/pesanan.service';
import { CreatePesananDto } from '../dto/create_pesanan.dto';
import { UpdatePesananDto } from '../dto/update_pesanan.dto';

@Controller('pesanan')
export class PesananController {
  constructor(private readonly pesananService: PesananService) {}

  @Post()
  create(@Body() createPesananDto: CreatePesananDto) {
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
  update(@Param('id') id: number, @Body() updatePesananDto: UpdatePesananDto) {
    return this.pesananService.update(id, updatePesananDto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.pesananService.delete(id);
  }
}
