import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch, // Menggunakan PATCH untuk update sebagian
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
import { UpdateBookingDto } from 'src/dto/update-booking.dto'; // DTO untuk update full booking
import { BookingResponseDto } from 'src/dto/booking_response.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard'; 
import { NotificationGateway } from 'src/notification/notification.gateway'; // <-- Tambahkan ini
import { PushNotificationService } from 'src/services/notification/push.service';
import { SubscriptionService } from 'src/services/notification/subscription.service';

import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
// import { AdminAuthGuard } from 'src/auth/strategies/admin_auth.guard'; // <-- Hapus ini
import { UpdateBookingStatusDto } from 'src/dto/update_booking_status.dto'; // <-- Pastikan ini DTO yang benar
import { DropoffService } from 'src/services/dropoff.service';
import { ArmadaService } from 'src/services/armada.service';
import { SupirService } from 'src/services/supir.service';
import { CustomRuteFasilitasService } from 'src/services/custom-rute-fasilitas.service';

@ApiTags('Booking')
@ApiBearerAuth() // Menunjukkan bahwa endpoint di controller ini memerlukan token JWT
@UseGuards(JwtAuthGuard) // Melindungi semua endpoint di controller ini secara default
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
  @SwaggerApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Data input tidak valid atau entitas terkait tidak ditemukan.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Akses Ditolak: Hanya pengguna biasa (user) yang dapat membuat booking.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Gagal membuat booking.',
  })
  @UseGuards(RolesGuard) // <--- Gunakan RolesGuard
  @Roles(Role.User) // <--- Hanya User yang bisa membuat booking
  async create(@Body(ValidationPipe) dto: CreateBookingDto, @Req() req: any) {
    try {
      const user = req.user; // Objek user dari JwtStrategy: { id, username, roles: [], ... }

      console.log('User object:', user);
    console.log('User roles:', user?.roles);
    console.log('Role.User value:', Role.User);
      if (!user || !user.id || !user.roles || !user.roles.includes(Role.User)) {
        throw new ForbiddenException('Hanya pengguna biasa yang dapat membuat booking.');
      }

      // Gunakan user.id sebagai userIdFromToken
      const userIdFromToken = user.id;

      const booking = await this.bookingService.createBooking(dto, userIdFromToken);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Booking berhasil dibuat',
        data: booking,
      };
    } catch (error) {
      console.error('Error membuat booking:', error);
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

 // Di BookingController, pada method updateBookingStatus:
 @Patch(':id/status') // Endpoint khusus untuk update status booking
 @HttpCode(HttpStatus.OK)
 @UseGuards(RolesGuard)
 @Roles(Role.Admin, Role.SuperAdmin)
 @ApiOperation({ summary: 'Memperbarui status booking (khusus Admin)' })
 @ApiParam({ name: 'id', type: 'number', description: 'ID booking yang akan diperbarui statusnya' })
 @ApiBody({ type: UpdateBookingStatusDto, description: 'Status booking baru' })
 @SwaggerApiResponse({
   status: HttpStatus.OK,
   description: 'Status booking berhasil diperbarui.',
   type: BookingResponseDto,
 })
 @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Booking tidak ditemukan.' })
 @SwaggerApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Status booking tidak valid atau input salah.' })
 @SwaggerApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Tidak terautentikasi.' })
 @SwaggerApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Tidak memiliki hak akses admin.' })
 @SwaggerApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Gagal memperbarui status booking.' })
 async updateBookingStatus(
   @Param('id', ParseIntPipe) id: number,
   @Body(ValidationPipe) updateBookingStatusDto: UpdateBookingStatusDto, // Gunakan DTO yang tepat
   @Req() req: any
 ) {
   try {
     const admin = req.user;
 
     // Audit trail
     console.log(`Admin ${admin.username} (ID: ${admin.id}) memperbarui status booking ${id} menjadi ${updateBookingStatusDto.statusBooking}`);
 
     // Panggil service untuk memperbarui status - sekarang statusBooking pasti ada
     const updatedBooking = await this.bookingService.updateBooking(id, {
       statusBooking: updateBookingStatusDto.statusBooking
     } as UpdateBookingDto);
 
     return {
       statusCode: HttpStatus.OK,
       message: 'Status booking berhasil diperbarui',
       data: updatedBooking,
     };
   } catch (error) {
     console.error(`Error memperbarui status booking ${id}:`, error);
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
  @ApiOperation({ summary: 'Melihat semua booking (khusus Admin)' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Daftar semua booking berhasil diambil.',
    type: [BookingResponseDto],
  })
  @SwaggerApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Akses Ditolak: Hanya admin yang dapat melihat semua booking.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Gagal mengambil daftar booking.',
  })
  @UseGuards(RolesGuard) // <--- Gunakan RolesGuard
  @Roles(Role.Admin, Role.SuperAdmin) // <--- Hanya admin atau superadmin yang bisa melihat semua booking
  async findAll() {
    try {

      const bookings = await this.bookingService.findAllBookings(); // Pastikan service ini mendukung query jika diperlukan
      return {
        statusCode: HttpStatus.OK,
        message: 'Daftar booking berhasil diambil',
        data: bookings,
      };
    } catch (error) {
      console.error('Error mengambil semua booking:', error);
      throw new InternalServerErrorException('Gagal mengambil daftar booking.');
    }
  }

  @Get('my-bookings') // Endpoint untuk pengguna biasa melihat booking mereka sendiri
  @ApiOperation({ summary: 'Melihat semua booking untuk pengguna yang sedang login' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Booking pengguna berhasil diambil.',
    type: [BookingResponseDto],
  })
  @SwaggerApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Akses Ditolak: Hanya pengguna biasa yang dapat melihat booking mereka sendiri.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Gagal mengambil booking pengguna.',
  })
  @UseGuards(RolesGuard) // <--- Gunakan RolesGuard
  @Roles(Role.User) // <--- Hanya User yang bisa melihat booking mereka sendiri
  async findMyBookings(@Req() req: any) {
    try {
      const user = req.user;

      // Memastikan bahwa yang melihat booking adalah user biasa dan memiliki ID
      if (!user || !user.id || !user.roles || !user.roles.includes(Role.User)) {
        throw new ForbiddenException('Hanya pengguna biasa yang dapat melihat booking mereka sendiri.');
      }

      // Gunakan user.id sebagai userId
      const bookings = await this.bookingService.findBookingsByUserId(user.id);
      return {
        statusCode: HttpStatus.OK,
        message: 'Booking pengguna berhasil diambil',
        data: bookings,
      };
    } catch (error) {
      console.error('Error mengambil booking pengguna:', error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Gagal mengambil booking pengguna.');
    }
  }

  // booking.controller.ts atau dropoff-booking.controller.ts

@Get('options') // Endpoint untuk memuat opsi armada/supir setelah Dropoff dibuat
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Get available options (armada & driver) based on an existing Dropoff' })
async getDropoffBookingOptions(
  @Query('dropoffId', ParseIntPipe) dropoffId: number,
  @Query('fasilitasId', ParseIntPipe) fasilitasId: number, // Opsional, untuk validasi atau logging
) {
  // 1. Ambil data Dropoff dari database menggunakan dropoffId
  // Asumsikan Anda memiliki service untuk ini
  const dropoff = await this.dropoffService.findOneDropoff(dropoffId);

  if (!dropoff) {
      throw new NotFoundException(`Dropoff dengan ID ${dropoffId} tidak ditemukan.`);
  }

  // 2. Ekstrak Tanggal Mulai dan Selesai (sudah dalam format Date)
  const startDate = dropoff.tanggalMulai; 
  const endDate = dropoff.tanggalSelesai; 

  // 3. Panggil service ketersediaan (menggunakan logic yang sama)
  const availableArmadas = await this.armadaService.getAvailableArmada(startDate, endDate);
  const availableSupirs = await this.supirService.getAvailableSupir(startDate, endDate);

  console.log("data supir: ", availableSupirs)

  return {
    message: 'Opsi armada dan supir tersedia berhasil diambil',
    data: {
      dropoffDetail: dropoff, 
      armadas: availableArmadas,
      supirs: availableSupirs,
    },
    statusCode: HttpStatus.OK,
  };
}

@Get('custom-rute-options')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Get available options (armada & driver) based on an existing Custom Route' })
async getCustomRuteBookingOptions(
  @Query('customRuteId', ParseIntPipe) customRuteId: number,
) {
  // 1. Ambil data Custom Rute dari database
  // Asumsikan CustomRuteService memiliki metode findOneCustomRute
  const customRute = await this.customRuteService.findOneCustomRuteFasilitas(customRuteId);

  if (!customRute) {
      throw new NotFoundException(`Rute Kustom dengan ID ${customRuteId} tidak ditemukan.`);
  }

  // 2. Ekstrak Tanggal Mulai dan Selesai
  const startDate = customRute.tanggalMulai; 
  const endDate = customRute.tanggalSelesai; 

  // 3. Panggil service ketersediaan (logic yang sama dengan Dropoff)
  const [availableArmadas, availableSupirs] = await Promise.all([
      this.armadaService.getAvailableArmada(startDate, endDate),
      this.supirService.getAvailableSupir(startDate, endDate),
  ]);

  return {
    message: 'Opsi armada dan supir tersedia berhasil diambil',
    data: {
      customRuteDetail: customRute, 
      armadas: availableArmadas,
      supirs: availableSupirs,
    },
    statusCode: HttpStatus.OK,
  };
}
  @Get(':id')
async findOne(@Param('id') id: string) {
  const booking = await this.bookingService.findBookingForRefund(parseInt(id));
  if (!booking) {
    throw new NotFoundException('Booking not found');
  }
  return booking;
}

  @Get(':id')
  @ApiOperation({ summary: 'Melihat satu booking berdasarkan ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID booking' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Booking berhasil diambil.',
    type: BookingResponseDto,
  })
  @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Booking tidak ditemukan.' })
  @SwaggerApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Gagal mengambil booking.',
  })
  // Endpoint ini bisa diakses oleh user pemilik booking atau admin
  // @UseGuards(RolesGuard)
  // @Roles(Role.User, Role.Admin, Role.SuperAdmin)
  // async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
  //   try {
  //     const user = req.user;
  //     const booking = await this.bookingService.findOneBooking(id);
  //     if (!booking) {
  //       throw new NotFoundException(`Booking dengan ID ${id} tidak ditemukan.`);
  //     }

  //     // Otorisasi: User biasa hanya bisa melihat booking miliknya
  //     if (user.roles.includes(Role.User) && booking.userId !== user.id) {
  //       throw new ForbiddenException('Anda tidak diizinkan untuk melihat booking ini.');
  //     }
  //     // Admin/SuperAdmin bisa melihat booking siapapun

  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: 'Booking berhasil diambil',
  //       data: booking,
  //     };
  //   } catch (error) {
  //     if (error instanceof NotFoundException || error instanceof ForbiddenException) {
  //       throw error;
  //     }
  //     console.error(`Error mengambil booking dengan ID ${id}:`, error);
  //     throw new InternalServerErrorException('Gagal mengambil booking.');
  //   }
  // }

  @Patch(':id') // Metode update booking yang lebih umum (bukan hanya status)
  @ApiOperation({ summary: 'Memperbarui booking yang sudah ada' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID booking' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Booking berhasil diperbarui.',
    type: BookingResponseDto,
  })
  @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Booking tidak ditemukan.' })
  @SwaggerApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Data input tidak valid.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Gagal memperbarui booking.',
  })
  @UseGuards(RolesGuard) // <--- Gunakan RolesGuard
  @Roles(Role.User, Role.Admin, Role.SuperAdmin) // User bisa update miliknya, Admin bisa update siapa saja
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateBookingDto: UpdateBookingDto,
    @Req() req: any // Tambahkan req untuk akses user yang login
  ) {
    try {
      const user = req.user; // User yang sedang login

      const existingBooking = await this.bookingService.findOneBooking(id);
      if (!existingBooking) {
        throw new NotFoundException(`Booking dengan ID ${id} tidak ditemukan.`);
      }

      // Jika user yang login adalah user biasa, pastikan dia hanya mengupdate booking miliknya sendiri
      if (user.roles.includes(Role.User) && existingBooking.userId !== user.id) {
        throw new ForbiddenException('Anda tidak diizinkan untuk memperbarui booking ini.');
      }
      // Admin/SuperAdmin akan lolos karena roles mereka termasuk Role.Admin/Role.SuperAdmin

      const updatedBooking = await this.bookingService.updateBooking(id, updateBookingDto);

      return {
        statusCode: HttpStatus.OK,
        message: 'Booking berhasil diperbarui',
        data: updatedBooking,
      };
    } catch (error) {
      console.error(`Error memperbarui booking dengan ID ${id}:`, error);
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
  @ApiOperation({ summary: 'Menghapus booking berdasarkan ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID booking' })
  @SwaggerApiResponse({ status: HttpStatus.OK, description: 'Booking berhasil dihapus.' })
  @SwaggerApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Booking tidak ditemukan.' })
  @SwaggerApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Gagal menghapus booking.',
  })
  @UseGuards(RolesGuard) // <--- Gunakan RolesGuard
  @Roles(Role.User, Role.Admin, Role.SuperAdmin) // User bisa hapus miliknya, Admin bisa hapus siapa saja
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    try {
      const user = req.user; // User yang sedang login

      const existingBooking = await this.bookingService.findOneBooking(id);
      if (!existingBooking) {
        throw new NotFoundException(`Booking dengan ID ${id} tidak ditemukan.`);
      }

      // Jika user yang login adalah user biasa, pastikan dia hanya menghapus booking miliknya sendiri
      if (user.roles.includes(Role.User) && existingBooking.userId !== user.id) {
        throw new ForbiddenException('Anda tidak diizinkan untuk menghapus booking ini.');
      }
      // Jika admin yang login, biarkan mereka menghapus booking siapapun

      const deleted = await this.bookingService.removeBooking(id);
      if (!deleted) {
        throw new NotFoundException(`Booking dengan ID ${id} tidak ditemukan.`);
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Booking berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error(`Error menghapus booking dengan ID ${id}:`, error);
      throw new InternalServerErrorException('Gagal menghapus booking.');
    }
  }
}