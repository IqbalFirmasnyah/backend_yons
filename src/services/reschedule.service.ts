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
      private push: PushNotificationService, // <<=== injeksi push service
      private gateway: NotificationGateway,  // <<=== injeksi gateway
    ) {}
  
    /** Hitung selisih hari penuh (T - R) dengan UTC */
    private calculateDaysDifference(startDate: Date, endDate: Date): number {
      const msInDay = 1000 * 60 * 60 * 24;
      const startUTC = Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
      );
      const endUTC = Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
      );
      return Math.floor((startUTC - endUTC) / msInDay);
    }
  
    // =======================================================
    // ⭐ VALIDASI: H-4 & H+2 (H+1 dilarang)
    // =======================================================
    public validateRescheduleEligibility(
      booking: Booking,
      tanggalBaru: Date,
      tanggalPengajuan: Date = new Date(),
    ): void {
      const daysDiff = this.calculateDaysDifference(
        booking.tanggalMulaiWisata,
        tanggalPengajuan,
      );
      const MIN_DAYS_DIFFERENCE = 4;
      if (daysDiff < MIN_DAYS_DIFFERENCE) {
        throw new BadRequestException(
          `Pengajuan reschedule harus dilakukan minimal H-${MIN_DAYS_DIFFERENCE} (4 hari) sebelum tanggal wisata lama. Selisih hari saat ini: ${daysDiff} hari.`,
        );
      }
  
      const tanggalPengajuanDateOnly = new Date(
        Date.UTC(
          tanggalPengajuan.getUTCFullYear(),
          tanggalPengajuan.getUTCMonth(),
          tanggalPengajuan.getUTCDate(),
        ),
      );
      const tanggalBaruDateOnly = new Date(
        Date.UTC(
          tanggalBaru.getUTCFullYear(),
          tanggalBaru.getUTCMonth(),
          tanggalBaru.getUTCDate(),
        ),
      );
  
      const HPlusOne = new Date(tanggalPengajuanDateOnly);
      HPlusOne.setUTCDate(tanggalPengajuanDateOnly.getUTCDate() + 1);
  
      if (tanggalBaruDateOnly.getTime() === HPlusOne.getTime()) {
        throw new BadRequestException(
          `Tanggal baru (${format(
            tanggalBaruDateOnly,
            'dd-MM-yyyy',
          )}) tidak boleh H+1 dari tanggal pengajuan. Silakan pilih tanggal H+2 atau lebih.`,
        );
      }
      if (tanggalBaruDateOnly.getTime() <= HPlusOne.getTime()) {
        throw new BadRequestException(
          'Tanggal baru harus setidaknya H+2 atau lebih setelah tanggal pengajuan.',
        );
      }
    }
  
    // ====================== CREATE =========================
    async createRescheduleRequest(
      dto: CreateRescheduleDto,
      userId: number,
    ): Promise<Reschedule> {
      const booking = await this.prisma.booking.findUnique({
        where: { bookingId: dto.bookingId },
        include: { user: { select: { userId: true } } }, // ambil userId untuk notifikasi
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
  
      // 🔔 Notifikasi ke user & admin: ada request reschedule masuk (pending)
      const payload = {
        bookingId: created.bookingId,
        newDate: created.tanggalBaru.toISOString(),
        status: 'pending',
        updatedAt: new Date().toISOString(),
      };
      console.log(
        '[SERVER] sending booking.rescheduled (pending)',
        userId,
        payload,
      );
      // WS (tanpa status agar sesuai tipe gateway saat ini; jika tipe gateway sudah diubah, boleh sertakan status)
      this.gateway.bookingRescheduled(userId, {
        bookingId: payload.bookingId,
        newDate: payload.newDate,
        updatedAt: payload.updatedAt,
      });
      // Web Push (boleh bawa status)
      this.push.bookingRescheduled(userId, payload);
  
      return created;
    }
  
    // ====================== UPDATE STATUS (ADMIN) =========================
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
        // kirim tanggal baru booking
        const payload = {
          bookingId: updated.bookingId,
          newDate: updated.booking.tanggalMulaiWisata.toISOString(),
          status: 'approved',
          updatedAt: nowIso,
        };
        console.log(
          '[SERVER] sending booking.rescheduled (approved)',
          updated.userId,
          payload,
        );
        this.gateway.bookingRescheduled(updated.userId, {
          bookingId: payload.bookingId,
          newDate: payload.newDate,
          updatedAt: payload.updatedAt,
        });
        this.push.bookingRescheduled(updated.userId, payload);
      } else if (dto.status === RescheduleStatus.REJECTED) {
        // tolak (tanpa perubahan jadwal)
        const payload = {
          bookingId: updated.bookingId,
          status: 'rejected',
          updatedAt: nowIso,
          newDate: '',
        };
        console.log(
          '[SERVER] sending booking.rescheduled (rejected)',
          updated.userId,
          payload,
        );
        this.gateway.bookingRescheduled(updated.userId, {
          bookingId: payload.bookingId,
          newDate: payload.newDate,
          updatedAt: payload.updatedAt,
        });
        this.push.bookingRescheduled(updated.userId, payload);
      } else {
        // fallback untuk status lain (tetap informasikan)
        const payload = {
          bookingId: updated.bookingId,
          status: String(updated.status).toLowerCase(),
          updatedAt: nowIso,
          newDate: '',
        };
        console.log(
          '[SERVER] sending booking.rescheduled (other)',
          updated.userId,
          payload,
        );
        this.gateway.bookingRescheduled(updated.userId, {
          bookingId: payload.bookingId,
          newDate: payload.newDate,
          updatedAt: payload.updatedAt,
        });
        this.push.bookingRescheduled(updated.userId, payload);
      }
  
      return updated;
    }
  
    // ====================== QUERY =========================
    async findOne(id: number): Promise<Reschedule | null> {
      return this.prisma.reschedule.findUnique({
        where: { rescheduleId: id },
        include: { booking: true, user: true },
      });
    }
  
    async findAllPending(): Promise<Reschedule[]> {
      return this.prisma.reschedule.findMany({
        where: { status: RescheduleStatus.PENDING },
        include: { booking: true, user: true },
      });
    }
  }
  