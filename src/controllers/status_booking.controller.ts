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
  import { UpdateStatusBookingService } from 'src/services/status_booking.service'; 
  import { CreateUpdateStatusBookingDto } from '../dto/create_status_booking.dto';
  import { UpdateUpdateStatusBookingDto } from '../dto/update_status_booking.dto';
  
  @Controller('status-booking')
  export class UpdateStatusBookingController {
    constructor(private readonly service: UpdateStatusBookingService) {}
  
    @Post()
    async create(@Body() dto: CreateUpdateStatusBookingDto) {
      return this.service.create(dto);
    }
  
    @Get()
    async findAll() {
      return this.service.findAll();
    }
  
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
      return this.service.findOne(id);
    }
  
    @Patch(':id')
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: UpdateUpdateStatusBookingDto,
    ) {
      return this.service.update(id, dto);
    }
  
    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
      return this.service.delete(id);
    }
  }
  