// booking.controller.ts
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
    UseGuards,
    Req,
    HttpStatus,
    HttpCode,
  } from '@nestjs/common';
  import { BookingService } from 'src/services/booking.service'; 
  import { CreateBookingDto, UpdateBookingDto, AssignResourcesDto } from '../dto/create_booking.dto';
  import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../auth/strategies/jwt_auth.guard';
//   import { RolesGuard } from '../auth/guards/roles.guard';
//   import { Roles } from '../auth/decorators/roles.decorator';
  
  @ApiTags('bookings')
  @Controller('bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class BookingController {
    constructor(private readonly bookingService: BookingService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create new booking' })
    @ApiResponse({ status: 201, description: 'Booking created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 404, description: 'Package not found' })
    create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
      const userId = req.user?.userId;
      createBookingDto.userId = userId;
      
      return this.bookingService.create(createBookingDto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all bookings with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiQuery({ name: 'userId', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
    findAll(
      @Query('page') page?: string,
      @Query('limit') limit?: string,
      @Query('status') status?: string,
      @Query('userId') userId?: string,
    ) {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;
      const userIdNum = userId ? parseInt(userId, 10) : undefined;
  
      return this.bookingService.findAll(pageNum, limitNum, status, userIdNum);
    }
  
    @Get('stats')
    @ApiOperation({ summary: 'Get booking statistics' })
    @ApiQuery({ name: 'userId', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    getStats(@Query('userId') userId?: string) {
      const userIdNum = userId ? parseInt(userId, 10) : undefined;
      return this.bookingService.getStats(userIdNum);
    }
  
    @Get('my-bookings')
    @ApiOperation({ summary: 'Get current user bookings' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiResponse({ status: 200, description: 'User bookings retrieved successfully' })
    getMyBookings(
      @Req() req: any,
      @Query('page') page?: string,
      @Query('limit') limit?: string,
      @Query('status') status?: string,
    ) {
      
      const userId = req.user?.userId;
      
      
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;
  
      return this.bookingService.findAll(pageNum, limitNum, status, userId);
    }
  
    @Get('code/:kodeBooking')
    @ApiOperation({ summary: 'Get booking by booking code' })
    @ApiResponse({ status: 200, description: 'Booking found' })
    @ApiResponse({ status: 404, description: 'Booking not found' })
    findByCode(@Param('kodeBooking') kodeBooking: string) {
      return this.bookingService.findByCode(kodeBooking);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get booking by ID' })
    @ApiResponse({ status: 200, description: 'Booking found' })
    @ApiResponse({ status: 404, description: 'Booking not found' })
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.bookingService.findOne(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update booking' })
    @ApiResponse({ status: 200, description: 'Booking updated successfully' })
    @ApiResponse({ status: 404, description: 'Booking not found' })
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateBookingDto: UpdateBookingDto,
      @Req() req: any,
    ) {
      
      const updatedBy = {
        userId: req.user?.userId,
        adminId: req.user?.adminId,
      };

  
      return this.bookingService.update(id, updateBookingDto, updatedBy);
    }
  
    @Patch(':id/assign-resources')
    @ApiOperation({ summary: 'Assign driver and vehicle to booking' })
    @ApiResponse({ status: 200, description: 'Resources assigned successfully' })
    @ApiResponse({ status: 400, description: 'Resources not available' })
    @ApiResponse({ status: 404, description: 'Booking not found' })
    // @UseGuards(RolesGuard)
    // @Roles('admin', 'super_admin')
    assignResources(
      @Param('id', ParseIntPipe) id: number,
      @Body() assignResourcesDto: AssignResourcesDto,
      @Req() req: any,
    ) {
      const updatedBy = {
        adminId: req.user?.adminId,
      };
     
  
      return this.bookingService.assignResources(
        id,
        assignResourcesDto.supirId,
        assignResourcesDto.armadaId,
        updatedBy,
      );
    }
  
    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel booking' })
    @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
    @ApiResponse({ status: 400, description: 'Booking cannot be cancelled' })
    @ApiResponse({ status: 404, description: 'Booking not found' })
    @HttpCode(HttpStatus.OK)
    cancel(
      @Param('id', ParseIntPipe) id: number,
      @Body('reason') reason: string,
      @Req() req: any,
    ) {
      const updatedBy = {
        userId: req.user?.userId,
        adminId: req.user?.adminId,
      };
     
  
      return this.bookingService.cancel(id, reason || 'Cancelled by user', updatedBy);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete booking' })
    @ApiResponse({ status: 200, description: 'Booking deleted successfully' })
    @ApiResponse({ status: 400, description: 'Cannot delete confirmed booking' })
    @ApiResponse({ status: 404, description: 'Booking not found' })
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.bookingService.remove(id);
    }
  
    @Post('update-expired')
    @ApiOperation({ summary: 'Update expired bookings (Admin only)' })
    @ApiResponse({ status: 200, description: 'Expired bookings updated' })
    // @UseGuards(RolesGuard)
    // @Roles('admin', 'super_admin')
    @HttpCode(HttpStatus.OK)
    updateExpired() {
      return this.bookingService.updateExpiredBookings();
    }
  }