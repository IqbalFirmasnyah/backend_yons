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
import { PushNotificationService } from './notification/push-notification.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

interface AuthUser {
  id: number;
  role: 'user' | 'admin';
}

type RefundWithUser = Prisma.RefundGetPayload<{
  include: {
    user: { select: { userId: true; namaLengkap: true } };
    pembayaran: true;
    pesanan: true;
    pesananLuarKota: true;
    booking: true;
    approvedByAdmin: true;
    processedByAdmin: true;
  };
}>;

@Injectable()
export class RefundService {
  constructor(
    private prisma: PrismaService,
    private push: PushNotificationService,
    private gateway: NotificationGateway,
  ) {}

  // ---------------- CREATE REFUND ----------------
  async createRefund(userId: number, bookingId: number, dto: CreateRefundDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId },
      include: { pembayaran: true },
    });

    if (!booking) throw new NotFoundException('Booking tidak ditemukan.');
    if (booking.userId !== userId) {
      throw new BadRequestException('Booking does not belong to the current user.');
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
    if (existingRefund) {
      throw new BadRequestException('Refund sudah diajukan untuk booking ini.');
    }

    // === HITUNG 10% POTONGAN ===
    // Ambil total dasar: pembayaran.jumlahBayar (jika ada) else estimasiHarga
    // Catatan: jumlahBayar & estimasiHarga bertipe Decimal di Prisma
    const baseDecimal: Prisma.Decimal = booking.pembayaran?.jumlahBayar
      ? new Prisma.Decimal(booking.pembayaran.jumlahBayar as any)
      : new Prisma.Decimal(booking.estimasiHarga as any);

    const tenPercent = new Prisma.Decimal(0.10);
    const potonganAdmin = baseDecimal.mul(tenPercent); // 10% dari total
    const jumlahRefundFinal = baseDecimal.sub(potonganAdmin);

    // Simpan refund; abaikan dto.jumlahRefund, gunakan perhitungan server
    const refund = await this.prisma.refund.create({
      data: {
        userId,
        bookingId,
        pembayaranId: dto.pembayaranId,
        alasanRefund: dto.alasanRefund,
        // nilai bruto yang dimohonkan bisa sama dengan total dasar
        // tapi yang penting "jumlahRefundFinal" adalah nilai setelah potongan.
        jumlahRefund: baseDecimal,
        metodeRefund: dto.metodeRefund,
        rekeningTujuan: dto.rekeningTujuan,
        statusRefund: RefundStatus.PENDING,
        kodeRefund: `REF-${Date.now()}`,
        // simpan potongan dalam nilai UANG (bukan persen)
        jumlahPotonganAdmin: potonganAdmin,
        jumlahRefundFinal: jumlahRefundFinal,
        tanggalPengajuan: new Date(),
      },
    });

    
    const payload = {
      bookingId,
      refundId: refund.refundId,
      amount: Number(refund.jumlahRefundFinal ?? jumlahRefundFinal),
      status: refund.statusRefund,
      updatedAt: new Date().toISOString(),
    };
    this.gateway.bookingRefunded(userId, {
      bookingId: payload.bookingId,
      refundId: payload.refundId,
      status: payload.status,
      updatedAt: payload.updatedAt,
      amount: payload.amount,
    });
    this.push.bookingRefunded(userId, payload);

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

  // ---------------- CHECK ELIGIBILITY ----------------
  async checkBookingEligibility(userId: number, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId },
      include: { pembayaran: true },
    });
    if (!booking) throw new NotFoundException('Booking tidak ditemukan');
    if (booking.userId !== userId)
      throw new ForbiddenException('Booking does not belong to the current user');

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
      throw new BadRequestException('Refund sudah pernah diajukan untuk booking ini');

    return {
      eligible: true,
      booking,
      message: 'Booking eligible untuk refund',
    };
  }

  // ---------------- GET ALL REFUNDS (ADMIN) ----------------

  
  async findAllRefunds(): Promise<RefundWithUser[]> {
    return this.prisma.refund.findMany({
      include: {
        user: { select: { userId: true, namaLengkap: true } },
        pembayaran: true,
        pesanan: true,
        pesananLuarKota: true,
        booking: true,
        approvedByAdmin: true,
        processedByAdmin: true,
      },
      orderBy: { refundId: 'desc' },
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
    if (!refund) throw new NotFoundException(`Refund with ID ${id} not found.`);
    return refund;
  }

  // ---------------- UPDATE REFUND ----------------
  async updateRefund(id: number, dto: UpdateRefundDto): Promise<Refund> {
    const existingRefund = await this.findOneRefund(id);

    // Validasi transisi status
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

    const updatedRefund = await this.prisma.refund.update({
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

    // 🔔 Notifikasi: status refund berubah
    const payload = {
      bookingId: updatedRefund.bookingId!,
      refundId: updatedRefund.refundId,
      amount: Number(updatedRefund.jumlahRefundFinal ?? updatedRefund.jumlahRefund),
      status: updatedRefund.statusRefund,
      updatedAt: new Date().toISOString(),
    };
    console.log('[SERVER] sending booking.refunded (update)', updatedRefund.userId, payload);
    this.gateway.bookingRefunded(updatedRefund.userId, {
      bookingId: payload.bookingId,
      refundId: payload.refundId,
      status: payload.status,
      updatedAt: payload.updatedAt,
      amount: payload.amount,
    });
    this.push.bookingRefunded(updatedRefund.userId, payload);

    return updatedRefund;
  }

  // ---------------- DELETE REFUND ----------------
  async removeRefund(id: number, user: AuthUser) {
    const refund = await this.findOneRefund(id);

    if (user.role === 'user') {
      if (refund.userId !== user.id) throw new ForbiddenException('Access denied');
      if (refund.statusRefund !== RefundStatus.PENDING)
        throw new BadRequestException('Can only delete pending refund requests');
    }

    const deleted = await this.prisma.refund.delete({ where: { refundId: id } });

    // 🔔 Notifikasi (opsional)
    const payload = {
      bookingId: refund.bookingId!,
      refundId: refund.refundId,
      status: 'deleted',
      amount: Number(refund.jumlahRefundFinal ?? refund.jumlahRefund),
      updatedAt: new Date().toISOString(),
    };
    console.log('[SERVER] sending booking.refunded (deleted)', refund.userId, payload);
    this.gateway.bookingRefunded(refund.userId, {
      bookingId: payload.bookingId,
      refundId: payload.refundId,
      status: payload.status,
      updatedAt: payload.updatedAt,
      amount: payload.amount,
    });
    this.push.bookingRefunded(refund.userId, payload);

    return deleted;
  }
}
