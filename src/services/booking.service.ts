import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from 'src/dto/create_booking.dto';
import { UpdateBookingDto } from 'src/dto/update-booking.dto';
import { Booking, Prisma } from '@prisma/client';
import { JenisFasilitasEnum } from 'src/dto/create-fasilitas.dto';
import { PushNotificationService } from './notification/push-notification.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

// =================== Helper Harga ===================

enum PriceMode {
  PER_PESERTA = 'PER_PESERTA',
  FLAT = 'FLAT',
}

/** Hitung total berdasarkan mode harga. */
function calcTotal(
  base: Prisma.Decimal,
  jumlahPeserta: number,
  mode: PriceMode,
): Prisma.Decimal {
  return mode === PriceMode.PER_PESERTA ? base.mul(jumlahPeserta) : base;
}

export enum BookingStatus {
  WAITING = 'waiting approve admin',
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export const bookingReportInclude = Prisma.validator<Prisma.BookingInclude>()({
  user: { select: { namaLengkap: true, email: true } },
  paket: { select: { namaPaket: true, lokasi: true } },
  paketLuarKota: { select: { namaPaket: true, tujuanUtama: true } },
  fasilitas: { select: { namaFasilitas: true, jenisFasilitas: true } },
  supir: { select: { nama: true } },
  armada: { select: { platNomor: true } },
  pembayaran: { select: { statusPembayaran: true, jumlahBayar: true, tanggalPembayaran: true } },
  reschedules:true,
});

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: typeof bookingReportInclude
}>;



@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private push: PushNotificationService,
    private gateway: NotificationGateway,
  ) {}

  // ---------- CREATE ----------
  async createBooking(
    dto: CreateBookingDto,
    userIdFromToken: number,
  ): Promise<Booking> {
    // Validasi mutual exclusive (paket vs paketLuarKota vs fasilitas)
    const selectedOptions = [dto.paketId, dto.paketLuarKotaId, dto.fasilitasId].filter(Boolean);
    if (selectedOptions.length > 1) {
      throw new BadRequestException(
        'Only one of paketId, paketLuarKotaId, or fasilitasId can be provided.',
      );
    }
    if (selectedOptions.length === 0) {
      throw new BadRequestException(
        'At least one of paketId, paketLuarKotaId, or fasilitasId must be provided.',
      );
    }

    // Ambil user + referensi supir & armada
    const [user, supir, armada] = await this.prisma.$transaction([
      this.prisma.user.findUnique({ where: { userId: userIdFromToken } }),
      this.prisma.supir.findUnique({ where: { supirId: dto.supirId } }),
      this.prisma.armada.findUnique({ where: { armadaId: dto.armadaId } }),
    ]);
    if (!user) throw new NotFoundException('User not found.');
    if (!supir) throw new NotFoundException(`Supir with ID ${dto.supirId} not found.`);
    if (!armada) throw new NotFoundException(`Armada with ID ${dto.armadaId} not found.`);

    // Setup tanggal
    let finalTanggalMulaiWisata: Date = new Date(dto.tanggalMulaiWisata);
    let finalTanggalSelesaiWisata: Date = new Date(dto.tanggalSelesaiWisata || dto.tanggalMulaiWisata);

    // Untuk koneksi Prisma
    let connectPaket: Prisma.PaketWisataCreateNestedOneWithoutBookingInput | undefined;
    let connectPaketLuarKota: Prisma.PaketWisataLuarKotaCreateNestedOneWithoutBookingInput | undefined;
    let connectFasilitas: Prisma.FasilitasCreateNestedOneWithoutBookingsInput | undefined;

    // Harga dasar + mode
    let basePrice: Prisma.Decimal;
    let priceMode: PriceMode = PriceMode.FLAT;

    // --------- Branch penentuan basePrice + mode + tanggal selesai ---------
    if (dto.paketId) {
      const paket = await this.prisma.paketWisata.findUnique({
        where: { paketId: dto.paketId },
        select: { harga: true, durasiHari: true },
      });
      if (!paket) {
        throw new NotFoundException(`Paket Wisata (Dalam Kota) with ID ${dto.paketId} not found.`);
      }
      basePrice = paket.harga;
      priceMode = PriceMode.PER_PESERTA; // DIKALI
      connectPaket = { connect: { paketId: dto.paketId } };

      finalTanggalSelesaiWisata = new Date(finalTanggalMulaiWisata);
      finalTanggalSelesaiWisata.setDate(finalTanggalMulaiWisata.getDate() + paket.durasiHari - 1);

    } else if (dto.paketLuarKotaId) {
      const paketLuarKota = await this.prisma.paketWisataLuarKota.findUnique({
        where: { paketLuarKotaId: dto.paketLuarKotaId },
        select: { hargaEstimasi: true, estimasiDurasi: true },
      });
      if (!paketLuarKota) {
        throw new NotFoundException(
          `Paket Wisata Luar Kota with ID ${dto.paketLuarKotaId} not found.`,
        );
      }
      basePrice = paketLuarKota.hargaEstimasi;
      priceMode = PriceMode.PER_PESERTA; // DIKALI
      connectPaketLuarKota = { connect: { paketLuarKotaId: dto.paketLuarKotaId } };

      finalTanggalSelesaiWisata = new Date(finalTanggalMulaiWisata);
      finalTanggalSelesaiWisata.setDate(
        finalTanggalMulaiWisata.getDate() + paketLuarKota.estimasiDurasi - 1,
      );

    } else if (dto.fasilitasId) {
      const fasilitas = await this.prisma.fasilitas.findUnique({
        where: { fasilitasId: dto.fasilitasId },
        select: {
          jenisFasilitas: true,
          dropoff: { select: { hargaEstimasi: true } },
          customRute: { select: { hargaEstimasi: true, estimasiDurasi: true } },
          paketLuarKota: { select: { hargaEstimasi: true, estimasiDurasi: true } },
        },
      });
      if (!fasilitas) {
        throw new NotFoundException(`Fasilitas with ID ${dto.fasilitasId} not found.`);
      }

      switch (fasilitas.jenisFasilitas) {
        case JenisFasilitasEnum.DROPOFF: {
          if (!fasilitas.dropoff) {
            throw new BadRequestException('Fasilitas dropoff tidak memiliki detail.');
          }
          basePrice = fasilitas.dropoff.hargaEstimasi;
          priceMode = PriceMode.FLAT; // TIDAK DIKALI
          // dropoff = 1 hari → end = start
          finalTanggalSelesaiWisata = new Date(finalTanggalMulaiWisata);
          break;
        }
        case JenisFasilitasEnum.CUSTOM: {
          const c = fasilitas.customRute?.[0];
          if (!c) {
            throw new BadRequestException('Fasilitas custom tidak memiliki detail.');
          }
          basePrice = c.hargaEstimasi;
          priceMode = PriceMode.PER_PESERTA; // DIKALI
          finalTanggalSelesaiWisata = new Date(finalTanggalMulaiWisata);
          finalTanggalSelesaiWisata.setDate(finalTanggalMulaiWisata.getDate() + c.estimasiDurasi - 1);
          break;
        }
        case JenisFasilitasEnum.PAKET_LUAR_KOTA: {
          const p = fasilitas.paketLuarKota?.[0];
          if (!p) {
            throw new BadRequestException('Fasilitas paket_luar_kota tidak memiliki detail.');
          }
          basePrice = p.hargaEstimasi;
          priceMode = PriceMode.PER_PESERTA; // DIKALI
          finalTanggalSelesaiWisata = new Date(finalTanggalMulaiWisata);
          finalTanggalSelesaiWisata.setDate(finalTanggalMulaiWisata.getDate() + p.estimasiDurasi - 1);
          break;
        }
        default:
          throw new BadRequestException('Fasilitas type not supported for price calculation.');
      }
      connectFasilitas = { connect: { fasilitasId: dto.fasilitasId } };
    } else {
      throw new BadRequestException('A valid package or facility ID is required.');
    }

    // Cek bentrok supir & armada
    const bookingDate = new Date();
    const expiredAt = new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000); // 24 jam

    const [existingArmada, existingSupir] = await this.prisma.$transaction([
      this.prisma.booking.findFirst({
        where: {
          armadaId: dto.armadaId,
          statusBooking: { in: ['confirmed', 'payment_CONFIRMED', 'ongoing'] },
          tanggalMulaiWisata: { lte: finalTanggalSelesaiWisata },
          tanggalSelesaiWisata: { gte: finalTanggalMulaiWisata },
        },
      }),
      this.prisma.booking.findFirst({
        where: {
          supirId: dto.supirId,
          statusBooking: { in: ['confirmed', 'payment_CONFIRMED', 'ongoing'] },
          tanggalMulaiWisata: { lte: finalTanggalSelesaiWisata },
          tanggalSelesaiWisata: { gte: finalTanggalMulaiWisata },
        },
      }),
    ]);

    if (existingArmada) throw new BadRequestException('Armada sudah digunakan di tanggal ini');
    if (existingSupir) throw new BadRequestException('Supir sudah digunakan di tanggal ini');

    // Hitung TOTAL final (abaikan estimasiHargaTotal dari DTO)
    const total = calcTotal(basePrice, dto.jumlahPeserta, priceMode);

    try {
      return await this.prisma.booking.create({
        data: {
          user: { connect: { userId: user.userId } },
          supir: { connect: { supirId: dto.supirId } },
          armada: { connect: { armadaId: dto.armadaId } },
          tanggalBooking: bookingDate,
          tanggalMulaiWisata: finalTanggalMulaiWisata,
          tanggalSelesaiWisata: finalTanggalSelesaiWisata,
          jumlahPeserta: dto.jumlahPeserta,
          estimasiHarga: total, // SIMPAN TOTAL
          inputCustomTujuan: dto.inputCustomTujuan,
          catatanKhusus: dto.catatanKhusus,
          kodeBooking: this.generateUniqueBookingCode(),
          statusBooking: BookingStatus.WAITING,
          expiredAt,
          ...(connectPaket && { paket: connectPaket }),
          ...(connectPaketLuarKota && { paketLuarKota: connectPaketLuarKota }),
          ...(connectFasilitas && { fasilitas: connectFasilitas }),
        },
      });
    } catch (error) {
      console.error('Prisma error creating booking:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && (error.meta as any)?.target === 'Booking_kode_booking_key') {
          throw new BadRequestException('Generated booking code conflict. Please try again.');
        }
      }
      throw error;
    }
  }

 

  async getMyBookings(userId: number) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        paket: true,
        paketLuarKota: true,
        fasilitas: {
          include: {
            dropoff: true,
            customRute: true,
            paketLuarKota: true,
          },
        },
        supir: true,
        armada: true,
        pembayaran: true, // singular
      },
      orderBy: { tanggalBooking: 'desc' },
    });
  }

  // ---------- UPDATE ----------
  async updateBooking(
    id: number,
    dto: UpdateBookingDto,
  ): Promise<Booking | null> {
    const existingBooking = await this.prisma.booking.findUnique({
      where: { bookingId: id },
      include: {
        // +harga agar bisa re-calc bila hanya jumlahPeserta yang berubah
        paket: { select: { durasiHari: true, harga: true } },
        paketLuarKota: { select: { estimasiDurasi: true, hargaEstimasi: true } },
        fasilitas: {
          include: {
            customRute: { select: { estimasiDurasi: true, hargaEstimasi: true } },
            paketLuarKota: { select: { estimasiDurasi: true, hargaEstimasi: true } },
            dropoff: { select: { dropoffId: true, hargaEstimasi: true } },
          },
        },
        user: { select: { userId: true } },
      },
    });
    if (!existingBooking) return null;

    const prevStatus = existingBooking.statusBooking;
    const prevStart = existingBooking.tanggalMulaiWisata?.getTime();
    const prevEnd = existingBooking.tanggalSelesaiWisata?.getTime();

    // Validasi mutual exclusive pada update
    const updatedOptions = [dto.paketId, dto.paketLuarKotaId, dto.fasilitasId].filter(
      (val) => val !== undefined,
    );
    if (updatedOptions.length > 1) {
      throw new BadRequestException(
        'Only one of paketId, paketLuarKotaId, or fasilitasId can be updated at a time.',
      );
    }

    // Validasi supir/armada jika diubah
    if (dto.supirId !== undefined && dto.supirId !== null) {
      const supir = await this.prisma.supir.findUnique({
        where: { supirId: dto.supirId },
      });
      if (!supir) throw new NotFoundException(`Supir with ID ${dto.supirId} not found.`);
    }
    if (dto.armadaId !== undefined && dto.armadaId !== null) {
      const armada = await this.prisma.armada.findUnique({
        where: { armadaId: dto.armadaId },
      });
      if (!armada) throw new NotFoundException(`Armada with ID ${dto.armadaId} not found.`);
    }

    // Persiapan field update
    let connectDisconnectPaket:
      | Prisma.PaketWisataUpdateOneWithoutBookingNestedInput
      | undefined;
    let connectDisconnectPaketLuarKota:
      | Prisma.PaketWisataLuarKotaUpdateOneWithoutBookingNestedInput
      | undefined;
    let connectDisconnectFasilitas:
      | Prisma.FasilitasUpdateOneWithoutBookingsNestedInput
      | undefined;

    let updatedTanggalMulaiWisata: Date | undefined = dto.tanggalMulaiWisata
      ? new Date(dto.tanggalMulaiWisata)
      : existingBooking.tanggalMulaiWisata;
    let updatedTanggalSelesaiWisata: Date | undefined;
    let newDuration: number | undefined;

    // Jumlah peserta efektif (jika tidak dikirim, pakai existing)
    const effectiveJumlahPeserta =
      typeof dto.jumlahPeserta === 'number' && dto.jumlahPeserta > 0
        ? dto.jumlahPeserta
        : existingBooking.jumlahPeserta;

    // Akan kita tentukan base price & mode dari DTO bila user ganti paket/fasilitas
    let basePriceForUpdate: Prisma.Decimal | undefined;
    let priceModeForUpdate: PriceMode | undefined;

    if (dto.paketId !== undefined) {
      if (dto.paketId === null) {
        connectDisconnectPaket = { disconnect: true };
        basePriceForUpdate = new Prisma.Decimal(0);
        priceModeForUpdate = PriceMode.FLAT;
        newDuration = 0;
      } else {
        const paket = await this.prisma.paketWisata.findUnique({
          where: { paketId: dto.paketId },
          select: { harga: true, durasiHari: true },
        });
        if (!paket) {
          throw new NotFoundException(`Paket Wisata (Dalam Kota) with ID ${dto.paketId} not found.`);
        }
        basePriceForUpdate = paket.harga;
        priceModeForUpdate = PriceMode.PER_PESERTA; // DIKALI
        connectDisconnectPaket = { connect: { paketId: dto.paketId } };
        newDuration = paket.durasiHari;
      }
    } else if (dto.paketLuarKotaId !== undefined) {
      if (dto.paketLuarKotaId === null) {
        connectDisconnectPaketLuarKota = { disconnect: true };
        basePriceForUpdate = new Prisma.Decimal(0);
        priceModeForUpdate = PriceMode.FLAT;
        newDuration = 0;
      } else {
        const paketLuarKota = await this.prisma.paketWisataLuarKota.findUnique({
          where: { paketLuarKotaId: dto.paketLuarKotaId },
          select: { hargaEstimasi: true, estimasiDurasi: true },
        });
        if (!paketLuarKota) {
          throw new NotFoundException(
            `Paket Wisata Luar Kota with ID ${dto.paketLuarKotaId} not found.`,
          );
        }
        basePriceForUpdate = paketLuarKota.hargaEstimasi;
        priceModeForUpdate = PriceMode.PER_PESERTA; // DIKALI
        connectDisconnectPaketLuarKota = { connect: { paketLuarKotaId: dto.paketLuarKotaId } };
        newDuration = paketLuarKota.estimasiDurasi;
      }
    } else if (dto.fasilitasId !== undefined) {
      if (dto.fasilitasId === null) {
        connectDisconnectFasilitas = { disconnect: true };
        basePriceForUpdate = new Prisma.Decimal(0);
        priceModeForUpdate = PriceMode.FLAT;
        newDuration = 0;
      } else {
        const fasilitas = await this.prisma.fasilitas.findUnique({
          where: { fasilitasId: dto.fasilitasId },
          select: {
            jenisFasilitas: true,
            dropoff: { select: { hargaEstimasi: true } },
            customRute: { select: { hargaEstimasi: true, estimasiDurasi: true } },
            paketLuarKota: { select: { hargaEstimasi: true, estimasiDurasi: true } },
          },
        });
        if (!fasilitas) throw new NotFoundException(`Fasilitas with ID ${dto.fasilitasId} not found.`);

        switch (fasilitas.jenisFasilitas) {
          case JenisFasilitasEnum.DROPOFF: {
            if (!fasilitas.dropoff) {
              throw new BadRequestException('Fasilitas dropoff tidak memiliki detail.');
            }
            basePriceForUpdate = fasilitas.dropoff.hargaEstimasi;
            priceModeForUpdate = PriceMode.FLAT; // TIDAK DIKALI
            newDuration = 1;
            break;
          }
          case JenisFasilitasEnum.CUSTOM: {
            const c = fasilitas.customRute?.[0];
            if (!c) {
              throw new BadRequestException('Fasilitas custom tidak memiliki detail.');
            }
            basePriceForUpdate = c.hargaEstimasi;
            priceModeForUpdate = PriceMode.PER_PESERTA; // DIKALI
            newDuration = c.estimasiDurasi;
            break;
          }
          case JenisFasilitasEnum.PAKET_LUAR_KOTA: {
            const p = fasilitas.paketLuarKota?.[0];
            if (!p) {
              throw new BadRequestException('Fasilitas paket_luar_kota tidak memiliki detail.');
            }
            basePriceForUpdate = p.hargaEstimasi;
            priceModeForUpdate = PriceMode.PER_PESERTA; // DIKALI
            newDuration = p.estimasiDurasi;
            break;
          }
          default:
            throw new BadRequestException('Fasilitas type not supported.');
        }
        connectDisconnectFasilitas = { connect: { fasilitasId: dto.fasilitasId } };
      }
    }

    // Hitung tanggal selesai jika durasi baru ditentukan
    if (newDuration !== undefined && updatedTanggalMulaiWisata) {
      updatedTanggalSelesaiWisata = new Date(updatedTanggalMulaiWisata);
      updatedTanggalSelesaiWisata.setDate(
        updatedTanggalMulaiWisata.getDate() + newDuration - 1,
      );
    } else if (dto.tanggalMulaiWisata) {
      // Jika hanya tanggal mulai yang berubah, derive durasi dari existing relation
      const existingDuration =
        existingBooking.paket?.durasiHari ||
        existingBooking.paketLuarKota?.estimasiDurasi ||
        existingBooking.fasilitas?.customRute?.[0]?.estimasiDurasi ||
        (existingBooking.fasilitas?.jenisFasilitas === JenisFasilitasEnum.DROPOFF ? 1 : 0);

      if (existingDuration) {
        updatedTanggalSelesaiWisata = new Date(updatedTanggalMulaiWisata!);
        updatedTanggalSelesaiWisata.setDate(
          updatedTanggalMulaiWisata!.getDate() + existingDuration - 1,
        );
      } else {
        updatedTanggalSelesaiWisata = updatedTanggalMulaiWisata; // fallback 1 hari
      }
    }

    // Jika user TIDAK mengganti paket/fasilitas → derive base & mode dari existing
    if (!basePriceForUpdate || !priceModeForUpdate) {
      if (existingBooking.paket) {
        basePriceForUpdate = existingBooking.paket.harga;
        priceModeForUpdate = PriceMode.PER_PESERTA;
      } else if (existingBooking.paketLuarKota) {
        basePriceForUpdate = existingBooking.paketLuarKota.hargaEstimasi;
        priceModeForUpdate = PriceMode.PER_PESERTA;
      } else if (existingBooking.fasilitas?.jenisFasilitas === JenisFasilitasEnum.DROPOFF) {
        basePriceForUpdate =
          existingBooking.fasilitas.dropoff?.hargaEstimasi ?? new Prisma.Decimal(0);
        priceModeForUpdate = PriceMode.PER_PESERTA;
      } else if (existingBooking.fasilitas?.jenisFasilitas === JenisFasilitasEnum.CUSTOM) {
        basePriceForUpdate =
          existingBooking.fasilitas.customRute?.[0]?.hargaEstimasi ?? new Prisma.Decimal(0);
        priceModeForUpdate = PriceMode.PER_PESERTA;
      } else if (existingBooking.fasilitas?.jenisFasilitas === JenisFasilitasEnum.PAKET_LUAR_KOTA) {
        basePriceForUpdate =
          existingBooking.fasilitas.paketLuarKota?.[0]?.hargaEstimasi ?? new Prisma.Decimal(0);
        priceModeForUpdate = PriceMode.PER_PESERTA;
      } else {
        basePriceForUpdate = new Prisma.Decimal(0);
        priceModeForUpdate = PriceMode.FLAT;
      }
    }

    // Siapkan payload update
    const dataToUpdate: Prisma.BookingUpdateInput = {
      tanggalMulaiWisata: updatedTanggalMulaiWisata,
      tanggalSelesaiWisata: updatedTanggalSelesaiWisata,
      jumlahPeserta: dto.jumlahPeserta,
      inputCustomTujuan: dto.inputCustomTujuan,
      catatanKhusus: dto.catatanKhusus,
      statusBooking: dto.statusBooking,
      // estimasiHarga akan diisi sesudah kita calc (di bawah)
    };

    // Re-calc total
    const recomputedTotal = calcTotal(
      basePriceForUpdate ?? new Prisma.Decimal(0),
      effectiveJumlahPeserta,
      priceModeForUpdate,
    );
    dataToUpdate.estimasiHarga = recomputedTotal;

    // Relasi supir/armada
    if (dto.supirId !== undefined) {
      if (dto.supirId === null) throw new BadRequestException('Supir ID cannot be null.');
      dataToUpdate.supir = { connect: { supirId: dto.supirId } };
    }
    if (dto.armadaId !== undefined) {
      if (dto.armadaId === null) throw new BadRequestException('Armada ID cannot be null.');
      dataToUpdate.armada = { connect: { armadaId: dto.armadaId } };
    }

    // Relasi paket/fasilitas (connect/disconnect)
    if (connectDisconnectPaket) dataToUpdate.paket = connectDisconnectPaket;
    if (connectDisconnectPaketLuarKota) dataToUpdate.paketLuarKota = connectDisconnectPaketLuarKota;
    if (connectDisconnectFasilitas) dataToUpdate.fasilitas = connectDisconnectFasilitas;

    // Pastikan hanya satu yang terhubung
    if (dto.paketId !== undefined && dto.paketId !== null) {
      dataToUpdate.paketLuarKota = { disconnect: true };
      dataToUpdate.fasilitas = { disconnect: true };
    } else if (dto.paketLuarKotaId !== undefined && dto.paketLuarKotaId !== null) {
      dataToUpdate.paket = { disconnect: true };
      dataToUpdate.fasilitas = { disconnect: true };
    } else if (dto.fasilitasId !== undefined && dto.fasilitasId !== null) {
      dataToUpdate.paket = { disconnect: true };
      dataToUpdate.paketLuarKota = { disconnect: true };
    }

    try {
      const updated = await this.prisma.booking.update({
        where: { bookingId: id },
        data: dataToUpdate,
        include: {
          user: true,
          paket: true,
          paketLuarKota: true,
          fasilitas: true,
          supir: true,
          armada: true,
        },
      });

      // Notifikasi perubahan
      const nowIso = new Date().toISOString();

      // a) Jika status berubah
      if (dto.statusBooking && dto.statusBooking !== prevStatus) {
        const payload = {
          bookingId: updated.bookingId,
          newStatus: updated.statusBooking,
          updatedAt: nowIso,
        };
        this.gateway.bookingStatusChanged(updated.userId, payload);
        this.push.bookingStatusChanged(updated.userId, payload);
      }

      // b) Jika jadwal berubah
      const currStart = updated.tanggalMulaiWisata?.getTime();
      const currEnd = updated.tanggalSelesaiWisata?.getTime();
      const scheduleChanged =
        (typeof prevStart === 'number' && typeof currStart === 'number' && prevStart !== currStart) ||
        (typeof prevEnd === 'number' && typeof currEnd === 'number' && prevEnd !== currEnd);

      if (scheduleChanged) {
        const payload = {
          bookingId: updated.bookingId,
          newDate: updated.tanggalMulaiWisata.toISOString(),
          updatedAt: nowIso,
        };
        this.gateway.bookingRescheduled(updated.userId, payload);
        this.push.bookingRescheduled(updated.userId, payload);
      }

      return updated;
    } catch (error) {
      console.error(`Prisma error updating booking with ID ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Booking with ID ${id} not found.`);
        }
        if ((error.meta as any)?.target === 'Booking_kode_booking_key') {
          throw new BadRequestException(
            'Booking code conflict during update. This should not happen if code is auto-generated.',
          );
        }
      }
      throw error;
    }
  }

  // ---------- ADMIN: FIND ALL ----------
  async findAllBookings(): Promise<BookingWithRelations[]> {
    return this.prisma.booking.findMany({
      include: bookingReportInclude,
      orderBy: { tanggalBooking: 'desc' },
    });
  }

  async findAllBookingsForReport(params?: {
    from?: Date;
    to?: Date;
    status?: string; // atau BookingStatus
  }): Promise<BookingWithRelations[]> {
    const where: Prisma.BookingWhereInput = {};
  
    if (params?.from || params?.to) {
      where.tanggalBooking = {};
      if (params.from) (where.tanggalBooking as any).gte = params.from;
      if (params.to)   (where.tanggalBooking as any).lte = params.to;
    }
    if (params?.status) where.statusBooking = params.status as any;
  
    return this.prisma.booking.findMany({
      where,
      include: bookingReportInclude,
      orderBy: { tanggalBooking: 'desc' },
    });
  }

  // ---------- DELETE ----------
  async removeBooking(id: number): Promise<boolean> {
    try {
      const result = await this.prisma.booking.delete({
        where: { bookingId: id },
      });
      return result !== null;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Booking with ID ${id} not found.`);
      }
      console.error(`Error deleting booking with ID ${id}:`, error);
      throw error;
    }
  }

  // ---------- UTIL ----------
  private generateUniqueBookingCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `BKG-${timestamp}-${random}`.toUpperCase();
  }

  // ---------- FIND BY USER (untuk MyBookingsPage) ----------
  async findBookingsByUserId(userId: number) {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { userId },
        include: {
          paket: { select: { namaPaket: true, lokasi: true, fotoPaket: true } },
          paketLuarKota: { select: { tujuanUtama: true, namaPaket: true } },
          reschedules: { select: { status: true, rescheduleId: true, tanggalBaru: true, alasan: true, createdAt: true } },
          fasilitas: {
            select: {
              namaFasilitas: true,
              jenisFasilitas: true,
              dropoff: { select: { namaTujuan: true, alamatTujuan: true } },
              customRute: { select: { tujuanList: true, catatanKhusus: true, hargaEstimasi: true, estimasiDurasi: true } },
              paketLuarKota: { select: { namaPaket: true, tujuanUtama: true, hargaEstimasi: true, estimasiDurasi: true } },
            },
          },
          supir: { select: { nama: true, nomorHp: true } },
          armada: { select: { jenisMobil: true, platNomor: true } },
          pembayaran: {
            select: {
              pembayaranId: true,
              metodePembayaran: true,
              jumlahBayar: true,
              tanggalPembayaran: true,
              buktiPembayaran: true,
              statusPembayaran: true,
            },
          },
        },
        orderBy: { tanggalBooking: 'desc' },
      });
      return bookings;
    } catch (error) {
      console.error('Error finding bookings by user ID:', error);
      throw new Error('Failed to retrieve user bookings');
    }
  }

  // ---------- FIND ONE ----------
  async findOneBooking(id: number): Promise<Booking | null> {
    return this.prisma.booking.findUnique({
      where: { bookingId: id },
      include: {
        user: true,
        paket: true,
        paketLuarKota: true,
        fasilitas: {
          select: {
            fasilitasId: true,
            namaFasilitas: true,
            jenisFasilitas: true,
            dropoff: true,
            customRute: { take: 1 },
            paketLuarKota: true,
          },
        },
        supir: true,
        armada: true,
        pembayaran: {
          select: {
            pembayaranId: true,
            metodePembayaran: true,
            jumlahBayar: true,
            tanggalPembayaran: true,
            buktiPembayaran: true,
            statusPembayaran: true,
            verifiedByAdminId: true,
          },
        },
      },
    });
  }

  // ---------- Refund Oriented ----------
  async findBookingForRefund(bookingId: number): Promise<Booking | null> {
    return this.prisma.booking.findUnique({
      where: { bookingId },
      include: {
        user: {
          select: {
            userId: true,
            namaLengkap: true,
            email: true,
            noHp: true,
          },
        },
        paket: {
          select: {
            namaPaket: true,
            lokasi: true,
            fotoPaket: true,
          },
        },
        paketLuarKota: {
          select: {
            namaPaket: true,
            tujuanUtama: true,
          },
        },
        fasilitas: {
          select: {
            namaFasilitas: true,
            jenisFasilitas: true,
            dropoff: { select: { namaTujuan: true, alamatTujuan: true } },
            customRute: { select: { tujuanList: true, catatanKhusus: true } },
            paketLuarKota: { select: { namaPaket: true, tujuanUtama: true } },
          },
        },
        supir: {
          select: {
            nama: true,
            nomorHp: true,
          },
        },
        armada: {
          select: {
            jenisMobil: true,
            platNomor: true,
          },
        },
        pembayaran: {
          select: {
            pembayaranId: true,
            metodePembayaran: true,
            jumlahBayar: true,
            tanggalPembayaran: true,
            buktiPembayaran: true,
            statusPembayaran: true,
            verifiedByAdminId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        refund: {
          select: {
            refundId: true,
            statusRefund: true,
            jumlahRefund: true,
            tanggalPengajuan: true,
          },
        },
      },
    });
  }

  private calculateDaysDifference(startDate: Date, endDate: Date): number {
    const msInDay = 1000 * 60 * 60 * 24;

    // Gunakan UTC agar tidak ke-drift timezone
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

    // (start - end) / msInDay → selisih hari penuh
    const daysDiff = Math.floor((startUTC - endUTC) / msInDay);
    return daysDiff;
  }

  async checkRefundEligibility(bookingId: number): Promise<{
    eligible: boolean;
    reason?: string;
    booking?: any;
  }> {
    const booking = await this.findBookingForRefund(bookingId);
    if (!booking) return { eligible: false, reason: 'Booking tidak ditemukan' };

    const MIN_DAYS_FOR_REFUND = 3;
    const now = new Date();

    // Hanya untuk booking yang sudah dikonfirmasi
    if (booking.statusBooking !== BookingStatus.CONFIRMED) {
      return {
        eligible: false,
        reason:
          'Refund hanya bisa diajukan untuk booking yang sudah Dikonfirmasi atau Terverifikasi Pembayaran.',
      };
    }

    const daysDiff = this.calculateDaysDifference(booking.tanggalMulaiWisata, now);

    if (daysDiff < MIN_DAYS_FOR_REFUND) {
      throw new BadRequestException(
        `Pengajuan refund harus dilakukan minimal H-${MIN_DAYS_FOR_REFUND} (3 hari) sebelum tanggal wisata. Selisih hari saat ini: ${daysDiff} hari.`,
      );
    }

    return { eligible: true, booking };
  }
}
