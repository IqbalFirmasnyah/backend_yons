// src/reschedule/reschedule.service.ts
import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { format } from 'date-fns'; // Diperlukan untuk memformat tanggal di pesan error
import { CreateRescheduleDto } from 'src/dto/create-reschedule.dto';
import { UpdateRescheduleDto } from 'src/dto/update-reschedule.dto';
import { Reschedule, Booking, User, Prisma } from '@prisma/client';

enum RescheduleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Injectable()
export class RescheduleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper function untuk menghitung selisih hari penuh (T - R)
   * Menggunakan UTC untuk konsistensi timezone.
   */
  private calculateDaysDifference(
    startDate: Date, // Tanggal Mulai Wisata (T)
    endDate: Date,   // Tanggal Pengajuan (R)
  ): number {
    const msInDay = 1000 * 60 * 60 * 24;
    
    // Set waktu ke 00:00:00 UTC
    const startUTC = Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
    );

    const endUTC = Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate()
    );
    
    return Math.floor((startUTC - endUTC) / msInDay);
  }


  // =======================================================
  // ⭐ METODE VALIDASI UTAMA: H-4 & H+1
  // =======================================================

  /**
   * Memvalidasi kelayakan Reschedule berdasarkan aturan H-4 dan H+2 (dari tanggal pengajuan).
   */
  public validateRescheduleEligibility(
    booking: Booking,
    tanggalBaru: Date,
    tanggalPengajuan: Date = new Date(),
  ): void {
    
    // --- Aturan 1: Batasan Waktu Pengajuan (Minimal H-4) ---
    const daysDiff = this.calculateDaysDifference(
      booking.tanggalMulaiWisata,
      tanggalPengajuan,
    );

    // Minimal 4 hari selisih yang diperlukan (H-4)
    const MIN_DAYS_DIFFERENCE = 4; 

    if (daysDiff < MIN_DAYS_DIFFERENCE) {
      throw new BadRequestException(
        `Pengajuan reschedule harus dilakukan minimal H-${MIN_DAYS_DIFFERENCE} (4 hari) sebelum tanggal wisata lama. Selisih hari saat ini: ${daysDiff} hari.`,
      );
    }

    // --- Aturan 2: Batasan Pemilihan Tanggal Baru (Minimal H+2 dari Pengajuan) ---
    
    // Pastikan tanggal yang dibandingkan adalah tanggal kalender (tanpa jam/menit)
    const tanggalPengajuanDateOnly = new Date(Date.UTC(tanggalPengajuan.getUTCFullYear(), tanggalPengajuan.getUTCMonth(), tanggalPengajuan.getUTCDate()));
    const tanggalBaruDateOnly = new Date(Date.UTC(tanggalBaru.getUTCFullYear(), tanggalBaru.getUTCMonth(), tanggalBaru.getUTCDate()));

    // Hitung tanggal H+1 dari pengajuan (untuk pengecekan larangan)
    const HPlusOne = new Date(tanggalPengajuanDateOnly);
    HPlusOne.setUTCDate(tanggalPengajuanDateOnly.getUTCDate() + 1); 

    // Cek apakah Tanggal Baru sama persis dengan H+1
    if (tanggalBaruDateOnly.getTime() === HPlusOne.getTime()) {
      throw new BadRequestException(
        `Tanggal baru (${format(tanggalBaruDateOnly, 'dd-MM-yyyy')}) tidak boleh H+1 dari tanggal pengajuan. Silakan pilih tanggal H+2 atau lebih.`,
      );
    }

    // ⭐ Validasi Pelengkap (Tanggal Baru harus > H+1)
    // Jika user memilih tanggal yang sama atau lebih awal dari H+1 (yaitu H+0 atau sebelumnya), tolak.
    if (tanggalBaruDateOnly.getTime() <= HPlusOne.getTime()) {
        throw new BadRequestException('Tanggal baru harus setidaknya H+2 atau lebih setelah tanggal pengajuan.');
    }
  }

  async createRescheduleRequest(dto: CreateRescheduleDto, userId: number): Promise<Reschedule> {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId: dto.bookingId },
    });
    
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found.`);
    }

    if (booking.userId !== userId) {
      throw new UnauthorizedException('You are not authorized to reschedule this booking.');
    }

    // Izinkan status pembayaran sukses
    if (booking.statusBooking !== 'confirmed' && booking.statusBooking !== 'payment_CONFIRMED') {
      throw new BadRequestException('Only confirmed or verified-payment bookings can be rescheduled.');
    }

    const tanggalBaru = new Date(dto.tanggalBaru);
    const tanggalPengajuan = new Date();
    
    // VALIDASI UTAMA: Panggil logika H-4 dan H+1
    this.validateRescheduleEligibility(booking, tanggalBaru, tanggalPengajuan);

    // Cek duplikasi request
    const existingPending = await this.prisma.reschedule.findFirst({
      where: {
        bookingId: dto.bookingId,
        status: RescheduleStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new BadRequestException('A pending reschedule request already exists for this booking.');
    }

    // Jika semua validasi lolos, buat request reschedule
    return this.prisma.reschedule.create({
      data: {
        bookingId: dto.bookingId,
        userId: userId,
        tanggalLama: booking.tanggalMulaiWisata,
        tanggalBaru: tanggalBaru,
        alasan: dto.alasan,
        status: RescheduleStatus.PENDING,
      },
    });
  }

  async updateRescheduleStatus(rescheduleId: number, dto: UpdateRescheduleDto, adminId: number): Promise<Reschedule> {
    const request = await this.prisma.reschedule.findUnique({
      where: { rescheduleId: rescheduleId },
      include: { booking: true }, 
    });

    if (!request) {
      throw new NotFoundException(`Reschedule request with ID ${rescheduleId} not found.`);
    }
    
    const bookingData = request.booking;
    if (!bookingData) {
        throw new InternalServerErrorException('Data booking terkait tidak ditemukan.');
    }

    if (request.status !== RescheduleStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be updated.');
    }

    if (dto.status === RescheduleStatus.APPROVED) {
      
      const tanggalLama = bookingData.tanggalMulaiWisata;
      const durasiMs = bookingData.tanggalSelesaiWisata.getTime() - tanggalLama.getTime();
      const tanggalSelesaiBaru = new Date(request.tanggalBaru.getTime() + durasiMs);

      // Update booking
      await this.prisma.booking.update({
        where: { bookingId: request.bookingId },
        data: {
          tanggalMulaiWisata: request.tanggalBaru,
          tanggalSelesaiWisata: tanggalSelesaiBaru,
        },
      });
    }

    const dataToUpdate: Prisma.RescheduleUpdateInput = {
      status: dto.status,
    };

    return this.prisma.reschedule.update({
      where: { rescheduleId: rescheduleId },
      data: dataToUpdate,
    });
  }

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