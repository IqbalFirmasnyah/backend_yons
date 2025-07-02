// src/pembayaran/pembayaran.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
  } from '@nestjs/common';
  import { PembayaranService } from 'src/services/pembayaran.service'; 
  import { CreatePembayaranDto } from '../dto/create_pembayaran.dto';
  import { UpdatePembayaranDto } from '../dto/update_pembayaran.dto';
  
  @Controller('pembayaran')
  export class PembayaranController {
    constructor(private readonly pembayaranService: PembayaranService) {}
  
    @Post()
    create(@Body() createDto: CreatePembayaranDto) {
      return this.pembayaranService.create(createDto);
    }
  
    @Get()
    findAll() {
      return this.pembayaranService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.pembayaranService.findOne(id);
    }
  
    @Patch(':id')
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateDto: UpdatePembayaranDto,
    ) {
      return this.pembayaranService.update(id, updateDto);
    }
  
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.pembayaranService.remove(id);
    }
  }
  