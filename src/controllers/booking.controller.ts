import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  UseGuards,
  Req,
  ParseIntPipe,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { BookingService } from 'src/services/booking.service';
import { CreateBookingDto } from 'src/dto/create_booking.dto';
import { UpdateBookingDto } from 'src/dto/update-booking.dto';
import { BookingResponseDto } from 'src/dto/booking_response.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateBookingStatusDto } from 'src/dto/update_booking_status.dto';
import { DropoffService } from 'src/services/dropoff.service';
import { ArmadaService } from 'src/services/armada.service';
import { SupirService } from 'src/services/supir.service';
import { CustomRuteFasilitasService } from 'src/services/custom-rute-fasilitas.service';

@ApiTags('Booking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('booking')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly dropoffService: DropoffService,
    private readonly armadaService: ArmadaService,
    private readonly supirService: SupirService,
    private readonly customRuteService: CustomRuteFasilitasService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Membuat booking baru' })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Booking berhasil dibuat.',
    type: BookingResponseDto,
  })
  @UseGuards(RolesGuard)
  @Roles(Role.User)
  async create(@Body(ValidationPipe) dto: CreateBookingDto, @Req() req: any) {
    try {
      const user = req.user;
      if (!user?.id || !user.roles?.includes(Role.User)) {
        throw new ForbiddenException('Hanya pengguna biasa yang dapat membuat booking.');
      }
      const booking = await this.bookingService.createBooking(dto, user.id);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Booking berhasil dibuat',
        data: booking,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal membuat booking.');
    }
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Memperbarui status booking (Admin)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({ type: UpdateBookingStatusDto })
  async updateBookingStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) body: UpdateBookingStatusDto,
    @Req() req: any,
  ) {
    try {
      const updatedBooking = await this.bookingService.updateBooking(id, {
        statusBooking: body.statusBooking,
      } as UpdateBookingDto);

      return {
        statusCode: HttpStatus.OK,
        message: 'Status booking berhasil diperbarui',
        data: updatedBooking,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal memperbarui status booking.');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Melihat semua booking (Admin)' })
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  async findAll() {
    try {
      const bookings = await this.bookingService.findAllBookings();
      return {
        statusCode: HttpStatus.OK,
        message: 'Daftar booking berhasil diambil',
        data: bookings,
      };
    } catch {
      throw new InternalServerErrorException('Gagal mengambil daftar booking.');
    }
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Melihat semua booking user yang login (termasuk status refund terbaru)' })
  @UseGuards(RolesGuard)
  @Roles(Role.User)
  async findMyBookings(@Req() req: any) {
    try {
      const user = req.user;
      if (!user?.id || !user.roles?.includes(Role.User)) {
        throw new ForbiddenException('Hanya pengguna biasa yang dapat melihat booking mereka sendiri.');
      }

      // <<< PERUBAHAN INTI: gunakan service baru yang sudah sertakan refund terbaru >>>
      const bookings = await this.bookingService.findBookingsWithRefundByUserId(user.id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Booking pengguna berhasil diambil',
        data: bookings,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Gagal mengambil booking pengguna.');
    }
  }

  @Get('options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get available options (armada & driver) for an existing Dropoff' })
  async getDropoffBookingOptions(
    @Query('dropoffId', ParseIntPipe) dropoffId: number,
    @Query('fasilitasId', ParseIntPipe) fasilitasId: number,
  ) {
    const dropoff = await this.dropoffService.findOneDropoff(dropoffId);
    if (!dropoff) {
      throw new NotFoundException(`Dropoff dengan ID ${dropoffId} tidak ditemukan.`);
    }
    const startDate = dropoff.tanggalMulai;
    const endDate = dropoff.tanggalSelesai;
    const [armadas, supirs] = await Promise.all([
      this.armadaService.getAvailableArmada(startDate, endDate),
      this.supirService.getAvailableSupir(startDate, endDate),
    ]);
    return {
      message: 'Opsi armada dan supir tersedia berhasil diambil',
      data: { dropoffDetail: dropoff, armadas, supirs },
      statusCode: HttpStatus.OK,
    };
  }

  @Get('custom-rute-options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get available options (armada & driver) for an existing Custom Route' })
  async getCustomRuteBookingOptions(
    @Query('customRuteId', ParseIntPipe) customRuteId: number,
  ) {
    const customRute = await this.customRuteService.findOneCustomRuteFasilitas(customRuteId);
    if (!customRute) {
      throw new NotFoundException(`Rute Kustom dengan ID ${customRuteId} tidak ditemukan.`);
    }
    const startDate = customRute.tanggalMulai;
    const endDate = customRute.tanggalSelesai;
    const [armadas, supirs] = await Promise.all([
      this.armadaService.getAvailableArmada(startDate, endDate),
      this.supirService.getAvailableSupir(startDate, endDate),
    ]);
    return {
      message: 'Opsi armada dan supir tersedia berhasil diambil',
      data: { customRuteDetail: customRute, armadas, supirs },
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Melihat satu booking (untuk refund page, disertai refund terbaru)' })
  @ApiParam({ name: 'id', type: 'number' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const booking = await this.bookingService.findBookingForRefund(id);
    if (!booking) throw new NotFoundException('Booking not found');
    return {
      statusCode: HttpStatus.OK,
      message: 'Booking berhasil diambil',
      data: booking,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Memperbarui booking' })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(RolesGuard)
  @Roles(Role.User, Role.Admin, Role.SuperAdmin)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateBookingDto: UpdateBookingDto,
    @Req() req: any,
  ) {
    try {
      const user = req.user;
      const existing = await this.bookingService.findOneBooking(id);
      if (!existing) throw new NotFoundException(`Booking dengan ID ${id} tidak ditemukan.`);
      if (user.roles.includes(Role.User) && (existing as any).userId !== user.id) {
        throw new ForbiddenException('Anda tidak diizinkan untuk memperbarui booking ini.');
      }
      const updated = await this.bookingService.updateBooking(id, updateBookingDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Booking berhasil diperbarui',
        data: updated,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal memperbarui booking.');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menghapus booking' })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(RolesGuard)
  @Roles(Role.User, Role.Admin, Role.SuperAdmin)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    try {
      const user = req.user;
      const existing = await this.bookingService.findOneBooking(id);
      if (!existing) throw new NotFoundException(`Booking dengan ID ${id} tidak ditemukan.`);
      if (user.roles.includes(Role.User) && (existing as any).userId !== user.id) {
        throw new ForbiddenException('Anda tidak diizinkan untuk menghapus booking ini.');
      }
      const ok = await this.bookingService.removeBooking(id);
      if (!ok) throw new NotFoundException(`Booking dengan ID ${id} tidak ditemukan.`);
      return { statusCode: HttpStatus.OK, message: 'Booking berhasil dihapus' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Gagal menghapus booking.');
    }
  }
}
