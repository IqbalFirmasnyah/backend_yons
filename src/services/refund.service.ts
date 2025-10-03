import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRefundDto, RefundStatus } from 'src/dto/create_refund.dto';
import { UpdateRefundDto } from 'src/dto/update_refund.dto';
import { Refund, Prisma } from '@prisma/client';

interface AuthUser {
  id: number;
  role: 'user' | 'admin';
}

@Injectable()
export class RefundService {
  constructor(private prisma: PrismaService) {}

  async createRefund(userId: number, bookingId: number, dto: CreateRefundDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId },
      include: { pembayaran: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan.');
    }

    if (booking.userId !== userId) {
      throw new BadRequestException(
        'Booking does not belong to the current user.',
      );
    }

    const existingRefund = await this.prisma.refund.findFirst({
      where: {
        bookingId,
        statusRefund: {
          in: [
            RefundStatus.PENDING,
            RefundStatus.APPROVED,
            RefundStatus.PROCESSING,
            RefundStatus.COMPLETED,
          ],
        },
      },
    });

    console.log('Booking:', booking);
    console.log('Current userId:', userId);

    if (existingRefund) {
      throw new BadRequestException('Refund sudah diajukan untuk booking ini.');
    }

    const refund = await this.prisma.refund.create({
      data: {
        userId,
        bookingId,
        pembayaranId: dto.pembayaranId,
        alasanRefund: dto.alasanRefund,
        jumlahRefund: dto.jumlahRefund,
        metodeRefund: dto.metodeRefund,
        rekeningTujuan: dto.rekeningTujuan,
        statusRefund: RefundStatus.PENDING,
        kodeRefund: `REF-${Date.now()}`,
        jumlahPotonganAdmin: 20,
        jumlahRefundFinal: dto.jumlahRefund,
        tanggalPengajuan: new Date(),
      },
    });

    return refund;
  }

  // ---------------- GET REFUNDS BY USER ----------------
  async getRefundsByUser(userId: number) {
    return this.prisma.refund.findMany({
      where: { userId },
      include: {
        booking: true,
        pembayaran: true,
        pesanan: true,
        pesananLuarKota: true,
      },
    });
  }

  async checkBookingEligibility(userId: number, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId },
      include: { pembayaran: true },
    });
    
    console.log('Booking:', booking);
    console.log('Current userId:', userId);
    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.userId !== userId)
      throw new ForbiddenException(
        'Booking does not belong to the current user',
      );

    const existingRefund = await this.prisma.refund.findFirst({
      where: {
        bookingId,
        statusRefund: {
          in: [
            RefundStatus.PENDING,
            RefundStatus.APPROVED,
            RefundStatus.PROCESSING,
            RefundStatus.COMPLETED,
          ],
        },
      },
    });


    if (existingRefund)
      throw new BadRequestException(
        'Refund sudah pernah diajukan untuk booking ini',
      );

    return {
      eligible: true,
      booking,
      message: 'Booking eligible untuk refund',
    };
  }

  // ---------------- GET ALL REFUNDS ----------------
  async findAllRefunds(): Promise<Refund[]> {
    return this.prisma.refund.findMany({
      include: {
        user: true,
        pembayaran: true,
        pesanan: true,
        pesananLuarKota: true,
        booking: true,
        approvedByAdmin: true,
        processedByAdmin: true,
      },
    });
  }

  // ---------------- GET ONE REFUND ----------------
  async findOneRefund(id: number): Promise<Refund> {
    const refund = await this.prisma.refund.findUnique({
      where: { refundId: id },
      include: {
        user: true,
        pembayaran: true,
        pesanan: true,
        pesananLuarKota: true,
        booking: true,
        approvedByAdmin: true,
        processedByAdmin: true,
      },
    });

    if (!refund) {
      throw new NotFoundException(`Refund with ID ${id} not found.`);
    }

    return refund;
  }

  // ---------------- UPDATE REFUND ----------------
  async updateRefund(id: number, dto: UpdateRefundDto): Promise<Refund> {
    const existingRefund = await this.findOneRefund(id);

    // Validasi status
    if (dto.statusRefund) {
      const currentStatus = existingRefund.statusRefund;
      const newStatus = dto.statusRefund;

      if (
        (newStatus === RefundStatus.APPROVED &&
          currentStatus !== RefundStatus.PENDING) ||
        (newStatus === RefundStatus.COMPLETED &&
          currentStatus !== RefundStatus.PROCESSING) ||
        (newStatus === RefundStatus.REJECTED &&
          currentStatus !== RefundStatus.PENDING)
      ) {
        throw new BadRequestException(
          `Invalid status transition from ${currentStatus} to ${newStatus}`,
        );
      }

      if (newStatus === RefundStatus.APPROVED)
        dto.tanggalDisetujui = new Date().toISOString();
      if (newStatus === RefundStatus.COMPLETED)
        dto.tanggalRefundSelesai = new Date().toISOString();
    }

    const data: Prisma.RefundUpdateInput = {
      alasanRefund: dto.alasanRefund,
      jumlahRefund:
        dto.jumlahRefund !== undefined
          ? new Prisma.Decimal(dto.jumlahRefund)
          : undefined,
      metodeRefund: dto.metodeRefund,
      rekeningTujuan: dto.rekeningTujuan,
      statusRefund: dto.statusRefund,
      jumlahPotonganAdmin:
        dto.jumlahPotonganAdmin !== undefined
          ? new Prisma.Decimal(dto.jumlahPotonganAdmin)
          : undefined,
      jumlahRefundFinal:
        dto.jumlahRefundFinal !== undefined
          ? new Prisma.Decimal(dto.jumlahRefundFinal)
          : undefined,
      buktiRefund: dto.buktiRefund,
      catatanAdmin: dto.catatanAdmin,
      tanggalDisetujui: dto.tanggalDisetujui
        ? new Date(dto.tanggalDisetujui)
        : undefined,
      tanggalRefundSelesai: dto.tanggalRefundSelesai
        ? new Date(dto.tanggalRefundSelesai)
        : undefined,

      // Relasi
      pesanan:
        dto.pesananId !== undefined
          ? dto.pesananId === null
            ? { disconnect: true }
            : { connect: { pesananId: dto.pesananId } }
          : undefined,
      pesananLuarKota:
        dto.pesananLuarKotaId !== undefined
          ? dto.pesananLuarKotaId === null
            ? { disconnect: true }
            : { connect: { pesananLuarKotaId: dto.pesananLuarKotaId } }
          : undefined,
      booking:
        dto.bookingId !== undefined
          ? dto.bookingId === null
            ? { disconnect: true }
            : { connect: { bookingId: dto.bookingId } }
          : undefined,
    };

    // Mutual exclusivity pesanan / booking
    if (dto.pesananId) {
      data.pesananLuarKota = { disconnect: true };
      data.booking = { disconnect: true };
    } else if (dto.pesananLuarKotaId) {
      data.pesanan = { disconnect: true };
      data.booking = { disconnect: true };
    } else if (dto.bookingId) {
      data.pesanan = { disconnect: true };
      data.pesananLuarKota = { disconnect: true };
    }

    try {
      return await this.prisma.refund.update({
        where: { refundId: id },
        data,
        include: {
          user: true,
          pembayaran: true,
          pesanan: true,
          pesananLuarKota: true,
          booking: true,
          approvedByAdmin: true,
          processedByAdmin: true,
        },
      });
    } catch (error) {
      console.error(`Error updating refund with ID ${id}:`, error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Refund with ID ${id} not found.`);
      }
      throw error;
    }
  }

  // ---------------- DELETE REFUND ----------------
  async removeRefund(id: number, user: AuthUser) {
    const refund = await this.findOneRefund(id);
  
    if (user.role === 'user') {
      if (refund.userId !== user.id)  // <- gunakan id
        throw new ForbiddenException('Access denied');
      if (refund.statusRefund !== RefundStatus.PENDING)
        throw new BadRequestException(
          'Can only delete pending refund requests',
        );
    }
  
    return this.prisma.refund.delete({ where: { refundId: id } });
  }  
}
