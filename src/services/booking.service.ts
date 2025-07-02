// booking.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, UpdateBookingDto } from '../dto/create_booking.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  // Generate unique booking code
  private generateBookingCode(): string {
    const prefix = 'BK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  // Create new booking
  async create(createBookingDto: CreateBookingDto) {
    const {
      userId,
      paketId,
      paketLuarKotaId,
      tanggalMulaiWisata,
      tanggalSelesaiWisata,
      jumlahPeserta,
      inputCustomTujuan,
      catatanKhusus,
    } = createBookingDto;

    // Validate that either paketId or paketLuarKotaId is provided
    if (!paketId && !paketLuarKotaId) {
      throw new BadRequestException('Either paketId or paketLuarKotaId must be provided');
    }

    // Validate dates
    const startDate = new Date(tanggalMulaiWisata);
    const endDate = new Date(tanggalSelesaiWisata);
    const now = new Date();

    if (startDate <= now) {
      throw new BadRequestException('Start date must be in the future');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Calculate estimated price based on package
    let estimasiHarga = 0;
    if (paketId) {
      const paket = await this.prisma.paketWisata.findUnique({
        where: { paketId },
      });
      if (!paket) {
        throw new NotFoundException('Package not found');
      }
      estimasiHarga = Number(paket.harga) * jumlahPeserta;
    } else if (paketLuarKotaId) {
      const paketLuarKota = await this.prisma.paketWisataLuarKota.findUnique({
        where: { paketLuarKotaId },
      });
      if (!paketLuarKota) {
        throw new NotFoundException('Out of town package not found');
      }
      estimasiHarga = Number(paketLuarKota.hargaEstimasi) * jumlahPeserta;
    }

    // Set expiration date (24 hours from creation)
    const expiredAt = new Date();
    expiredAt.setHours(expiredAt.getHours() + 24);

    const kodeBooking = this.generateBookingCode();

    const booking = await this.prisma.booking.create({
      data: {
        userId,
        paketId,
        paketLuarKotaId,
        kodeBooking,
        tanggalBooking: new Date(),
        tanggalMulaiWisata: startDate,
        tanggalSelesaiWisata: endDate,
        jumlahPeserta,
        estimasiHarga,
        inputCustomTujuan,
        statusBooking: 'draft',
        catatanKhusus,
        expiredAt,
      },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
            namaLengkap: true,
          },
        },
        paket: true,
        paketLuarKota: true,
      },
    });

    return booking;
  }

  // Get all bookings with pagination
  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string,
    userId?: number,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.BookingWhereInput = {};

    if (status) {
      where.statusBooking = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              userId: true,
              username: true,
              email: true,
              namaLengkap: true,
            },
          },
          paket: true,
          paketLuarKota: true,
          supir: true,
          armada: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get booking by ID
  async findOne(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId: id },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
            namaLengkap: true,
            noHp: true,
          },
        },
        paket: true,
        paketLuarKota: {
          include: {
            detailRute: {
              orderBy: {
                urutanKe: 'asc',
              },
            },
          },
        },
        supir: true,
        armada: true,
        updateStatus: {
          include: {
            updatedByUser: {
              select: {
                userId: true,
                username: true,
                namaLengkap: true,
              },
            },
            updatedByAdmin: {
              select: {
                adminId: true,
                username: true,
                namaLengkap: true,
              },
            },
          },
          orderBy: {
            timestampUpdate: 'desc',
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  // Get booking by booking code
  async findByCode(kodeBooking: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { kodeBooking },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
            namaLengkap: true,
            noHp: true,
          },
        },
        paket: true,
        paketLuarKota: true,
        supir: true,
        armada: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  // Update booking
  async update(id: number, updateBookingDto: UpdateBookingDto, updatedBy?: { userId?: number; adminId?: number }) {
    const existingBooking = await this.findOne(id);
    const oldStatus = existingBooking.statusBooking;

    const updatedBooking = await this.prisma.booking.update({
      where: { bookingId: id },
      data: {
        ...updateBookingDto,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
            namaLengkap: true,
          },
        },
        paket: true,
        paketLuarKota: true,
        supir: true,
        armada: true,
      },
    });

    // Record status update if status changed
    if (updateBookingDto.statusBooking && updateBookingDto.statusBooking !== oldStatus) {
      await this.prisma.updateStatusBooking.create({
        data: {
          bookingId: id,
          statusLama: oldStatus,
          statusBaru: updateBookingDto.statusBooking,
          updatedByUserId: updatedBy?.userId,
          updatedByAdminId: updatedBy?.adminId,
          timestampUpdate: new Date(),
          keterangan: updateBookingDto.catatanKhusus || 'Status updated',
        },
      });
    }

    return updatedBooking;
  }

  // Assign driver and vehicle to booking
  async assignResources(id: number, supirId: number, armadaId: number, updatedBy?: { userId?: number; adminId?: number }) {
    // Check if driver and vehicle are available
    const [supir, armada] = await Promise.all([
      this.prisma.supir.findUnique({
        where: { supirId },
      }),
      this.prisma.armada.findUnique({
        where: { armadaId },
      }),
    ]);

    if (!supir || supir.statusSupir !== 'tersedia') {
      throw new BadRequestException('Driver is not available');
    }

    if (!armada || armada.statusArmada !== 'tersedia') {
      throw new BadRequestException('Vehicle is not available');
    }

    const booking = await this.findOne(id);

    // Update booking with assigned resources
    const updatedBooking = await this.prisma.booking.update({
      where: { bookingId: id },
      data: {
        supirId,
        armadaId,
        statusBooking: 'confirmed',
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
            namaLengkap: true,
          },
        },
        paket: true,
        paketLuarKota: true,
        supir: true,
        armada: true,
      },
    });

    // Record status update
    await this.prisma.updateStatusBooking.create({
      data: {
        bookingId: id,
        statusLama: booking.statusBooking,
        statusBaru: 'confirmed',
        updatedByUserId: updatedBy?.userId,
        updatedByAdminId: updatedBy?.adminId,
        timestampUpdate: new Date(),
        keterangan: `Driver ${supir.nama} and vehicle ${armada.platNomor} assigned`,
      },
    });

    // Update driver and vehicle status
    await Promise.all([
      this.prisma.supir.update({
        where: { supirId },
        data: { statusSupir: 'bertugas' },
      }),
      this.prisma.armada.update({
        where: { armadaId },
        data: { statusArmada: 'digunakan' },
      }),
    ]);

    return updatedBooking;
  }

  // Cancel booking
  async cancel(id: number, reason: string, updatedBy?: { userId?: number; adminId?: number }) {
    const booking = await this.findOne(id);

    if (booking.statusBooking === 'cancelled' || booking.statusBooking === 'completed') {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { bookingId: id },
      data: {
        statusBooking: 'cancelled',
        catatanKhusus: reason,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
            namaLengkap: true,
          },
        },
        paket: true,
        paketLuarKota: true,
        supir: true,
        armada: true,
      },
    });

    // Record status update
    await this.prisma.updateStatusBooking.create({
      data: {
        bookingId: id,
        statusLama: booking.statusBooking,
        statusBaru: 'cancelled',
        updatedByUserId: updatedBy?.userId,
        updatedByAdminId: updatedBy?.adminId,
        timestampUpdate: new Date(),
        keterangan: reason,
      },
    });

    // Free up resources if they were assigned
    if (booking.supirId) {
      await this.prisma.supir.update({
        where: { supirId: booking.supirId },
        data: { statusSupir: 'tersedia' },
      });
    }

    if (booking.armadaId) {
      await this.prisma.armada.update({
        where: { armadaId: booking.armadaId },
        data: { statusArmada: 'tersedia' },
      });
    }

    return updatedBooking;
  }

  // Delete booking (soft delete by changing status)
  async remove(id: number) {
    const booking = await this.findOne(id);
    
    if (booking.statusBooking === 'confirmed' || booking.statusBooking === 'ongoing') {
      throw new BadRequestException('Cannot delete confirmed or ongoing booking');
    }

    // For draft bookings, we can actually delete them
    if (booking.statusBooking === 'draft') {
      return await this.prisma.booking.delete({
        where: { bookingId: id },
      });
    }

    // For other statuses, just mark as cancelled
    return await this.cancel(id, 'Booking deleted');
  }

  // Get booking statistics
  async getStats(userId?: number) {
    const where: Prisma.BookingWhereInput = userId ? { userId } : {};

    const [
      total,
      draft,
      pendingPayment,
      paymentVerified,
      confirmed,
      cancelled,
      completed,
      expired,
    ] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.count({ where: { ...where, statusBooking: 'draft' } }),
      this.prisma.booking.count({ where: { ...where, statusBooking: 'pending_payment' } }),
      this.prisma.booking.count({ where: { ...where, statusBooking: 'payment_verified' } }),
      this.prisma.booking.count({ where: { ...where, statusBooking: 'confirmed' } }),
      this.prisma.booking.count({ where: { ...where, statusBooking: 'cancelled' } }),
      this.prisma.booking.count({ where: { ...where, statusBooking: 'completed' } }),
      this.prisma.booking.count({ where: { ...where, statusBooking: 'expired' } }),
    ]);

    return {
      total,
      byStatus: {
        draft,
        pending_payment: pendingPayment,
        payment_verified: paymentVerified,
        confirmed,
        cancelled,
        completed,
        expired,
      },
    };
  }

  // Check and update expired bookings
  async updateExpiredBookings() {
    const now = new Date();
    
    const expiredBookings = await this.prisma.booking.updateMany({
      where: {
        expiredAt: {
          lt: now,
        },
        statusBooking: {
          in: ['draft', 'pending_payment'],
        },
      },
      data: {
        statusBooking: 'expired',
        updatedAt: now,
      },
    });

    return expiredBookings;
  }
}