import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseIntPipe,
  } from '@nestjs/common';
  import { NotifikasiService } from 'src/services/notifikasi.service'; 
  import { CreateNotifikasiDto } from '../dto/create_notifikasi.dto';
  import { UpdateNotifikasiDto } from '../dto/update_notifikasi.dto';
  
  @Controller('notifikasi')
  export class NotifikasiController {
    constructor(private readonly notifikasiService: NotifikasiService) {}
  
    @Post()
    create(@Body() createDto: CreateNotifikasiDto) {
      return this.notifikasiService.create(createDto);
    }
  
    @Get()
    findAll(
      @Query('userId') _userId?: string,
      @Query('adminId') _adminId?: string,
      @Query('isRead') _isRead?: string,
    ) {
      return this.notifikasiService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.notifikasiService.findOne(id);
    }
  
    @Patch(':id')
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateDto: UpdateNotifikasiDto,
    ) {
      return this.notifikasiService.update(id, updateDto);
    }
  
    @Patch(':id/read')
    markAsRead(@Param('id', ParseIntPipe) id: number) {
      return this.notifikasiService.markAsRead(id);
    }
  
    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
      return this.notifikasiService.delete(id);
    }
  }
  