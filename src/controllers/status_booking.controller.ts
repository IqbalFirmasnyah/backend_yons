import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { UpdateStatusBookingService } from '../services/status_booking.service';
import { CreateUpdateStatusBookingDto } from '../dto/create_status_booking.dto';
import { UpdateUpdateStatusBookingDto } from '../dto/update_status_booking.dto';

@Controller('update-status-booking')
export class UpdateStatusBookingController {
  constructor(private readonly updateStatusBookingService: UpdateStatusBookingService) {}

  @Post()
  create(@Body() createUpdateStatusBookingDto: CreateUpdateStatusBookingDto) {
    return this.updateStatusBookingService.create(createUpdateStatusBookingDto);
  }

  @Get()
  findAll() {
    return this.updateStatusBookingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.updateStatusBookingService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateUpdateStatusBookingDto: UpdateUpdateStatusBookingDto) {
    return this.updateStatusBookingService.update(id, updateUpdateStatusBookingDto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.updateStatusBookingService.delete(id);
  }
}
