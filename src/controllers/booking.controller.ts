import { Controller, Get, Post, Body, Param, Put, ParseIntPipe, Query } from '@nestjs/common';
import { BookingService } from '../services/booking.service';
import { CreateBookingDto } from '../dto/create_booking.dto';
import { UpdateBookingStatusDto } from '../dto/update_booking_status.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Get()
  findAll() {
    return this.bookingService.findAll();
  }

  @Get('user/:userId')
  getBookingHistory(@Param('userId', ParseIntPipe) userId: number) {
    return this.bookingService.getBookingHistory(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.findOne(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateBookingStatusDto,
    @Query('userId') userId?: number,
    @Query('adminId') adminId?: number
  ) {
    return this.bookingService.updateStatus(id, updateStatusDto, { userId, adminId });
  }

  @Put(':id/assign')
  assignSupirArmada(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignData: { supirId: number; armadaId: number }
  ) {
    return this.bookingService.assignSupirArmada(id, assignData.supirId, assignData.armadaId);
  }
}