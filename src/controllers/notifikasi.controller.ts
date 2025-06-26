import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { NotifikasiService } from '../services/notifikasi.service';
import { CreateNotifikasiDto } from '../dto/create_notifikasi.dto';
import { UpdateNotifikasiDto } from '../dto/update_notifikasi.dto';

@Controller('notifikasi')
export class NotifikasiController {
  constructor(private readonly notifikasiService: NotifikasiService) {}

  @Post()
  create(@Body() createNotifikasiDto: CreateNotifikasiDto) {
    return this.notifikasiService.create(createNotifikasiDto);
  }

  @Get()
  findAll() {
    return this.notifikasiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.notifikasiService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateNotifikasiDto: UpdateNotifikasiDto) {
    return this.notifikasiService.update(id, updateNotifikasiDto);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: number) {
    return this.notifikasiService.markAsRead(id);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.notifikasiService.delete(id);
  }
}
