import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { format } from 'date-fns';
import { CreateRescheduleDto } from 'src/dto/create-reschedule.dto';
import { UpdateRescheduleDto } from 'src/dto/update-reschedule.dto';
import { Reschedule, Booking } from '@prisma/client';
import { PushNotificationService } from './notification/push-notification.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

enum RescheduleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Injectable()
export class RescheduleService {
  constructor(
    private prisma: PrismaService,
    private push: PushNotificationService,
    private gateway: NotificationGateway,
  ) {}

  /** UTC date-only helper */
  private toUTCDateOnly(d: Date) {
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );
  }

  /** Hitung selisih hari penuh (later - earlier) pakai UTC (H-x) */
  private diffDaysUTC(later: Date, earlier: Date): number {
    const msInDay = 1000 * 60 * 60 * 24;
    const a = this.toUTCDateOnly(later).getTime();
    const b = this.toUTCDateOnly(earlier).getTime();
    return Math.floor((a - b) / msInDay);
  }

  /**
   * Validasi kebijakan reschedule:
   * - Pengajuan hanya valid jika hari ini masih H-4 atau lebih dari tanggal lama (>=4 hari)
   * - Tanggal baru tidak boleh H+1 dari tanggal pengajuan
   * - Tanggal baru minimal H+2 dari tanggal pengajuan
   */
  public validateRescheduleEligibility(
    booking: Booking,
    tanggalBaru: Date,
    tanggalPengajuan: Date = new Date(),
  ): void {
    // H-4 terhadap tanggalMulaiWisata
    const daysToOldStart = this.diffDaysUTC(
      booking.tanggalMulaiWisata,
      tanggalPengajuan,
    );
    const MIN_H_MINUS = 4;
    if (daysToOldStart < MIN_H_MINUS) {
      throw new BadRequestException(
        `Pengajuan reschedule harus dilakukan minimal H-${MIN_H_MINUS} (4 hari) sebelum tanggal wisata lama. Selisih hari saat ini: ${daysToOldStart} hari.`,
      );
    }

    // Larang H+1 dan wajib H+2 dari hari pengajuan
    const pengajuanUTC = this.toUTCDateOnly(tanggalPengajuan);
    const tBaruUTC = this.toUTCDateOnly(tanggalBaru);
    const hPlusOne = new Date(pengajuanUTC);
    hPlusOne.setUTCDate(hPlusOne.getUTCDate() + 1);
    const hPlusTwo = new Date(pengajuanUTC);
    hPlusTwo.setUTCDate(hPlusTwo.getUTCDate() + 2);

    if (tBaruUTC.getTime() === this.toUTCDateOnly(hPlusOne).getTime()) {
      throw new BadRequestException(
        `Tanggal baru (${format(tBaruUTC, 'dd-MM-yyyy')}) tidak boleh H+1 dari tanggal pengajuan. Silakan pilih tanggal H+2 atau lebih.`,
      );
    }
    if (tBaruUTC.getTime() < this.toUTCDateOnly(hPlusTwo).getTime()) {
      throw new BadRequestException(
        'Tanggal baru harus setidaknya H+2 atau lebih setelah tanggal pengajuan.',
      );
    }
  }
  

  /** ====== VALIDATE ONLY (dipanggil controller POST /reschedule/validate/:bookingId) ====== */
  async validateOnly(
    bookingId: number,
    tanggalBaruIso: string,
    userId: number,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId },
      include: { user: { select: { userId: true } } },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
    }
    if (booking.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to validate this booking.',
      );
    }
    if (
      booking.statusBooking !== 'confirmed' &&
      booking.statusBooking !== 'payment_CONFIRMED'
    ) {
      throw new BadRequestException(
        'Only confirmed or verified-payment bookings can be rescheduled.',
      );
    }

    const tanggalBaru = new Date(tanggalBaruIso);
    this.validateRescheduleEligibility(booking, tanggalBaru, new Date());

    // Jika lolos semua aturan
    return { ok: true, message: 'Validasi reschedule lolos.' };
  }

  async createRescheduleRequest(
    dto: CreateRescheduleDto,
    userId: number,
  ): Promise<Reschedule> {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId: dto.bookingId },
      include: { user: { select: { userId: true } } },
    });

    if (!booking)
      throw new NotFoundException(
        `Booking with ID ${dto.bookingId} not found.`,
      );
    if (booking.userId !== userId)
      throw new UnauthorizedException(
        'You are not authorized to reschedule this booking.',
      );
    if (
      booking.statusBooking !== 'confirmed' &&
      booking.statusBooking !== 'payment_CONFIRMED'
    ) {
      throw new BadRequestException(
        'Only confirmed or verified-payment bookings can be rescheduled.',
      );
    }

    const tanggalBaru = new Date(dto.tanggalBaru);
    const tanggalPengajuan = new Date();
    this.validateRescheduleEligibility(booking, tanggalBaru, tanggalPengajuan);

    const existingPending = await this.prisma.reschedule.findFirst({
      where: { bookingId: dto.bookingId, status: RescheduleStatus.PENDING },
    });
    if (existingPending) {
      throw new BadRequestException(
        'A pending reschedule request already exists for this booking.',
      );
    }

    const created = await this.prisma.reschedule.create({
      data: {
        bookingId: dto.bookingId,
        userId,
        tanggalLama: booking.tanggalMulaiWisata,
        tanggalBaru,
        alasan: dto.alasan,
        status: RescheduleStatus.PENDING,
      },
      include: { booking: true },
    });

    const payload = {
      bookingId: created.bookingId,
      newDate: created.tanggalBaru.toISOString(),
      status: 'pending',
      updatedAt: new Date().toISOString(),
    };
    this.gateway.bookingRescheduled(userId, {
      bookingId: payload.bookingId,
      newDate: payload.newDate,
      updatedAt: payload.updatedAt,
    });
    this.push.bookingRescheduled(userId, payload);

    return created;
  }

  /** ====================== UPDATE STATUS (ADMIN) ========================= */
  async updateRescheduleStatus(
    rescheduleId: number,
    dto: UpdateRescheduleDto,
    adminId: number,
  ): Promise<Reschedule> {
    const request = await this.prisma.reschedule.findUnique({
      where: { rescheduleId },
      include: { booking: true, user: true },
    });

    if (!request)
      throw new NotFoundException(
        `Reschedule request with ID ${rescheduleId} not found.`,
      );
    const bookingData = request.booking;
    if (!bookingData)
      throw new InternalServerErrorException(
        'Data booking terkait tidak ditemukan.',
      );
    if (request.status !== RescheduleStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be updated.');
    }

    // Jika APPROVED → update jadwal booking mengikuti tanggalBaru & durasi lama
    if (dto.status === RescheduleStatus.APPROVED) {
      const tanggalLama = bookingData.tanggalMulaiWisata;
      const durasiMs =
        bookingData.tanggalSelesaiWisata.getTime() - tanggalLama.getTime();
      const tanggalSelesaiBaru = new Date(
        request.tanggalBaru.getTime() + durasiMs,
      );

      await this.prisma.booking.update({
        where: { bookingId: request.bookingId },
        data: {
          tanggalMulaiWisata: request.tanggalBaru,
          tanggalSelesaiWisata: tanggalSelesaiBaru,
        },
      });
    }

    const updated = await this.prisma.reschedule.update({
      where: { rescheduleId },
      data: { status: dto.status },
      include: { booking: true, user: true },
    });

    // 🔔 Notifikasi hasil keputusan
    const nowIso = new Date().toISOString();
    if (dto.status === RescheduleStatus.APPROVED) {
      const payload = {
        bookingId: updated.bookingId,
        newDate: updated.booking.tanggalMulaiWisata.toISOString(),
        status: 'approved',
        updatedAt: nowIso,
      };
      this.gateway.bookingRescheduled(updated.userId, {
        bookingId: payload.bookingId,
        newDate: payload.newDate,
        updatedAt: payload.updatedAt,
      });
      this.push.bookingRescheduled(updated.userId, payload);
    } else if (dto.status === RescheduleStatus.REJECTED) {
      const payload = {
        bookingId: updated.bookingId,
        status: 'rejected',
        updatedAt: nowIso,
        newDate: '',
      };
      this.gateway.bookingRescheduled(updated.userId, {
        bookingId: payload.bookingId,
        newDate: payload.newDate,
        updatedAt: payload.updatedAt,
      });
      this.push.bookingRescheduled(updated.userId, payload);
    } else {
      const payload = {
        bookingId: updated.bookingId,
        status: String(updated.status).toLowerCase(),
        updatedAt: nowIso,
        newDate: '',
      };
      this.gateway.bookingRescheduled(updated.userId, {
        bookingId: payload.bookingId,
        newDate: payload.newDate,
        updatedAt: payload.updatedAt,
      });
      this.push.bookingRescheduled(updated.userId, payload);
    }

    return updated;
  }

  async findOne(id: number): Promise<Reschedule | null> {
    return this.prisma.reschedule.findUnique({
      where: { rescheduleId: id },
      include: { booking: true, user: true },
    });
  }

  // src/services/reschedule.service.ts
async findMineByUserId(userId: number) {
  return this.prisma.reschedule.findMany({
    where: { userId },
    orderBy: { rescheduleId: 'desc' },
    include: {
      booking: {
        select: {
          bookingId: true,
          kodeBooking: true,
          tanggalMulaiWisata: true,
          tanggalSelesaiWisata: true,
          statusBooking: true,
        },
      },
    },
  });
}


async findByBooking(bookingId: number, userId: number) {
  const booking = await this.prisma.booking.findUnique({ where: { bookingId } });
  if (!booking) throw new NotFoundException('Booking not found');
  if (booking.userId !== userId) throw new UnauthorizedException('Forbidden');

  return this.prisma.reschedule.findMany({
    where: { bookingId },
    orderBy: { rescheduleId: 'desc' },
  });
}



  async findAllPending(): Promise<Reschedule[]> {
    return this.prisma.reschedule.findMany({
      where: { status: RescheduleStatus.PENDING },
      include: { booking: true, user: true },
    });
  }
}
