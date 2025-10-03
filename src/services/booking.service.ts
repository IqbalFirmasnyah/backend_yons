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

export enum BookingStatus {
  WAITING = 'waiting approve admin',
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_VERIFIED = 'payment_CONFIRMED',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async createBooking(
    dto: CreateBookingDto,
    userIdFromToken: number,
  ): Promise<Booking> {
    const selectedOptions = [
      dto.paketId,
      dto.paketLuarKotaId,
      dto.fasilitasId,
    ].filter(Boolean);
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
    const [user, supir, armada] = await this.prisma.$transaction([
      this.prisma.user.findUnique({ where: { userId: userIdFromToken } }),
      this.prisma.supir.findUnique({ where: { supirId: dto.supirId } }),
      this.prisma.armada.findUnique({ where: { armadaId: dto.armadaId } }),
    ]);

    if (!user) throw new NotFoundException('User not found.');
    if (!supir)
      throw new NotFoundException(`Supir with ID ${dto.supirId} not found.`);
    if (!armada)
      throw new NotFoundException(`Armada with ID ${dto.armadaId} not found.`);

    let estimasiHarga: Prisma.Decimal;
    let finalTanggalMulaiWisata: Date = new Date(dto.tanggalMulaiWisata);
    let finalTanggalSelesaiWisata: Date = finalTanggalMulaiWisata; // Default to 1 day if not specified

    // Objects for Prisma connection
    let connectPaket:
      | Prisma.PaketWisataCreateNestedOneWithoutBookingInput
      | undefined;
    let connectPaketLuarKota:
      | Prisma.PaketWisataLuarKotaCreateNestedOneWithoutBookingInput
      | undefined;
    let connectFasilitas:
      | Prisma.FasilitasCreateNestedOneWithoutBookingsInput
      | undefined;

    if (dto.paketId) {
      const paket = await this.prisma.paketWisata.findUnique({
        where: { paketId: dto.paketId },
        select: { harga: true, durasiHari: true },
      });
      if (!paket)
        throw new NotFoundException(
          `Paket Wisata (Dalam Kota) with ID ${dto.paketId} not found.`,
        );
      estimasiHarga = paket.harga;
      connectPaket = { connect: { paketId: dto.paketId } };
      finalTanggalSelesaiWisata = new Date(finalTanggalMulaiWisata);
      finalTanggalSelesaiWisata.setDate(
        finalTanggalMulaiWisata.getDate() + paket.durasiHari - 1,
      );
    } else if (dto.paketLuarKotaId) {
      const paketLuarKota = await this.prisma.paketWisataLuarKota.findUnique({
        where: { paketLuarKotaId: dto.paketLuarKotaId },
        select: { hargaEstimasi: true, estimasiDurasi: true },
      });
      if (!paketLuarKota)
        throw new NotFoundException(
          `Paket Wisata Luar Kota with ID ${dto.paketLuarKotaId} not found.`,
        );
      estimasiHarga = paketLuarKota.hargaEstimasi;
      connectPaketLuarKota = {
        connect: { paketLuarKotaId: dto.paketLuarKotaId },
      };
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
          paketLuarKota: {
            select: { hargaEstimasi: true, estimasiDurasi: true },
          },
        },
      });

      if (!fasilitas)
        throw new NotFoundException(
          `Fasilitas with ID ${dto.fasilitasId} not found.`,
        );

      switch (fasilitas.jenisFasilitas) {
        case JenisFasilitasEnum.DROPOFF:
          if (!fasilitas.dropoff)
            throw new BadRequestException(
              'Fasilitas is of type dropoff but no associated dropoff details found.',
            );
          estimasiHarga = fasilitas.dropoff.hargaEstimasi;
          // Dropoff is always 1 day, so finalTanggalSelesaiWisata remains finalTanggalMulaiWisata
          break;
        case JenisFasilitasEnum.CUSTOM:
          // PERBAIKAN: Akses elemen pertama dari array
          if (!fasilitas.customRute || fasilitas.customRute.length === 0) {
            throw new BadRequestException(
              'Fasilitas is of type custom but no associated custom route details found.',
            );
          }
          const customRuteData = fasilitas.customRute[0];
          estimasiHarga = customRuteData.hargaEstimasi;
          finalTanggalSelesaiWisata = new Date(finalTanggalMulaiWisata);
          finalTanggalSelesaiWisata.setDate(
            finalTanggalMulaiWisata.getDate() +
              customRuteData.estimasiDurasi -
              1,
          );
          break;
        case JenisFasilitasEnum.PAKET_LUAR_KOTA:
          if (!fasilitas.paketLuarKota) {
            throw new BadRequestException(
              'Fasilitas is of type paket_luar_kota but no associated paketLuarKota details found.',
            );
          }
          const paketLuarKotaData = fasilitas.paketLuarKota[0];
          estimasiHarga = paketLuarKotaData.hargaEstimasi;
          finalTanggalSelesaiWisata = new Date(finalTanggalMulaiWisata);
          finalTanggalSelesaiWisata.setDate(
            finalTanggalMulaiWisata.getDate() +
              paketLuarKotaData.estimasiDurasi -
              1,
          );
          break;
        default:
          throw new BadRequestException(
            'Fasilitas type not supported for price calculation or date estimation.',
          );
      }
      connectFasilitas = { connect: { fasilitasId: dto.fasilitasId } };
    } else {
      throw new BadRequestException(
        'A valid package or facility ID is required.',
      );
    }

    const bookingDate = new Date();
    const expiredAt = new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

    try {
      // --- Cek armada ---
      const existingArmada = await this.prisma.booking.findFirst({
        where: {
          armadaId: dto.armadaId,
          statusBooking: { in: ['confirmed', 'payment_CONFIRMED', 'ongoing'] },
          tanggalMulaiWisata: { lte: finalTanggalSelesaiWisata },
          tanggalSelesaiWisata: { gte: finalTanggalMulaiWisata },
        },
      });
      if (existingArmada)
        throw new BadRequestException('Armada sudah digunakan di tanggal ini');

      // --- Cek supir ---
      const existingSupir = await this.prisma.booking.findFirst({
        where: {
          supirId: dto.supirId,
          statusBooking: { in: ['confirmed', 'payment_CONFIRMED', 'ongoing'] },
          tanggalMulaiWisata: { lte: finalTanggalSelesaiWisata },
          tanggalSelesaiWisata: { gte: finalTanggalMulaiWisata },
        },
      });
      if (existingSupir)
        throw new BadRequestException('Supir sudah digunakan di tanggal ini');

      return await this.prisma.booking.create({
        data: {
          user: { connect: { userId: user.userId } },
          supir: { connect: { supirId: dto.supirId } },
          armada: { connect: { armadaId: dto.armadaId } },
          tanggalBooking: bookingDate,
          tanggalMulaiWisata: finalTanggalMulaiWisata,
          tanggalSelesaiWisata: finalTanggalSelesaiWisata,
          jumlahPeserta: dto.jumlahPeserta,
          estimasiHarga: estimasiHarga,
          inputCustomTujuan: dto.inputCustomTujuan,
          catatanKhusus: dto.catatanKhusus,
          kodeBooking: this.generateUniqueBookingCode(),
          statusBooking: BookingStatus.WAITING,
          expiredAt: expiredAt,
          ...(connectPaket && { paket: connectPaket }),
          ...(connectPaketLuarKota && { paketLuarKota: connectPaketLuarKota }),
          ...(connectFasilitas && { fasilitas: connectFasilitas }),
        },
      });
    } catch (error) {
      console.error('Prisma error creating booking:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (
          error.code === 'P2002' &&
          error.meta?.target === 'Booking_kode_booking_key'
        ) {
          throw new BadRequestException(
            'Generated booking code conflict. Please try again.',
          );
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
        pembayaran: true, // ✅ singular
      },
      orderBy: { tanggalBooking: 'desc' },
    });
  }

  async updateBooking(
    id: number,
    dto: UpdateBookingDto,
  ): Promise<Booking | null> {
    const existingBooking = await this.prisma.booking.findUnique({
      where: { bookingId: id },
      include: {
        paket: { select: { durasiHari: true } },
        paketLuarKota: { select: { estimasiDurasi: true } },
        fasilitas: {
          include: {
            customRute: { select: { estimasiDurasi: true } },
            paketLuarKota: { select: { estimasiDurasi: true } },
            dropoff: { select: { dropoffId: true } },
          },
        },
      },
    });
    if (!existingBooking) {
      return null;
    }

    const updatedOptions = [
      dto.paketId,
      dto.paketLuarKotaId,
      dto.fasilitasId,
    ].filter((val) => val !== undefined);
    if (updatedOptions.length > 1) {
      throw new BadRequestException(
        'Only one of paketId, paketLuarKotaId, or fasilitasId can be updated at a time.',
      );
    }

    if (dto.supirId !== undefined && dto.supirId !== null) {
      const supir = await this.prisma.supir.findUnique({
        where: { supirId: dto.supirId },
      });
      if (!supir)
        throw new NotFoundException(`Supir with ID ${dto.supirId} not found.`);
    }
    if (dto.armadaId !== undefined && dto.armadaId !== null) {
      const armada = await this.prisma.armada.findUnique({
        where: { armadaId: dto.armadaId },
      });
      if (!armada)
        throw new NotFoundException(
          `Armada with ID ${dto.armadaId} not found.`,
        );
    }

    let newEstimasiHarga: Prisma.Decimal | undefined =
      existingBooking.estimasiHarga;
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

    if (dto.paketId !== undefined) {
      // Logic for updating paketId...
      if (dto.paketId === null) {
        connectDisconnectPaket = { disconnect: true };
        newEstimasiHarga = new Prisma.Decimal(0);
        newDuration = 0;
      } else {
        const paket = await this.prisma.paketWisata.findUnique({
          where: { paketId: dto.paketId },
          select: { harga: true, durasiHari: true },
        });
        if (!paket)
          throw new NotFoundException(
            `Paket Wisata (Dalam Kota) with ID ${dto.paketId} not found.`,
          );
        newEstimasiHarga = paket.harga;
        connectDisconnectPaket = { connect: { paketId: dto.paketId } };
        newDuration = paket.durasiHari;
      }
    } else if (dto.paketLuarKotaId !== undefined) {
      // Logic for updating paketLuarKotaId...
      if (dto.paketLuarKotaId === null) {
        connectDisconnectPaketLuarKota = { disconnect: true };
        newEstimasiHarga = new Prisma.Decimal(0);
        newDuration = 0;
      } else {
        const paketLuarKota = await this.prisma.paketWisataLuarKota.findUnique({
          where: { paketLuarKotaId: dto.paketLuarKotaId },
          select: { hargaEstimasi: true, estimasiDurasi: true },
        });
        if (!paketLuarKota)
          throw new NotFoundException(
            `Paket Wisata Luar Kota with ID ${dto.paketLuarKotaId} not found.`,
          );
        newEstimasiHarga = paketLuarKota.hargaEstimasi;
        connectDisconnectPaketLuarKota = {
          connect: { paketLuarKotaId: dto.paketLuarKotaId },
        };
        newDuration = paketLuarKota.estimasiDurasi;
      }
    } else if (dto.fasilitasId !== undefined) {
      // Logic for updating fasilitasId...
      if (dto.fasilitasId === null) {
        connectDisconnectFasilitas = { disconnect: true };
        newEstimasiHarga = new Prisma.Decimal(0);
        newDuration = 0;
      } else {
        const fasilitas = await this.prisma.fasilitas.findUnique({
          where: { fasilitasId: dto.fasilitasId },
          select: {
            jenisFasilitas: true,
            dropoff: { select: { hargaEstimasi: true } },
            customRute: {
              select: { hargaEstimasi: true, estimasiDurasi: true },
            },
            paketLuarKota: {
              select: { hargaEstimasi: true, estimasiDurasi: true },
            },
          },
        });
        if (!fasilitas)
          throw new NotFoundException(
            `Fasilitas with ID ${dto.fasilitasId} not found.`,
          );

        switch (fasilitas.jenisFasilitas) {
          case JenisFasilitasEnum.DROPOFF:
            if (!fasilitas.dropoff)
              throw new BadRequestException(
                'Fasilitas is of type dropoff but no associated details found.',
              );
            newEstimasiHarga = fasilitas.dropoff.hargaEstimasi;
            newDuration = 1;
            break;
          case JenisFasilitasEnum.CUSTOM:
            // PERBAIKAN: Akses elemen pertama dari array
            if (!fasilitas.customRute || fasilitas.customRute.length === 0) {
              throw new BadRequestException(
                'Fasilitas is of type custom but no associated details found.',
              );
            }
            const customRuteData = fasilitas.customRute[0];
            newEstimasiHarga = customRuteData.hargaEstimasi;
            newDuration = customRuteData.estimasiDurasi;
            break;
          case JenisFasilitasEnum.PAKET_LUAR_KOTA:
            if (!fasilitas.paketLuarKota) {
              throw new BadRequestException(
                'Fasilitas is of type paket_luar_kota but no associated paketLuarKota details found.',
              );
            }
            const paketLuarKotaData = fasilitas.paketLuarKota[0];
            newEstimasiHarga = paketLuarKotaData.hargaEstimasi;
            newDuration = paketLuarKotaData.estimasiDurasi;
            break;
          default:
            throw new BadRequestException(
              'Fasilitas type not supported for price calculation.',
            );
        }
        connectDisconnectFasilitas = {
          connect: { fasilitasId: dto.fasilitasId },
        };
      }
    }

    if (newDuration !== undefined && updatedTanggalMulaiWisata) {
      updatedTanggalSelesaiWisata = new Date(updatedTanggalMulaiWisata);
      updatedTanggalSelesaiWisata.setDate(
        updatedTanggalMulaiWisata.getDate() + newDuration - 1,
      );
    } else if (dto.tanggalMulaiWisata) {
      // If start date is updated but no type is changed, use existing duration
      const existingDuration =
        existingBooking.paket?.durasiHari ||
        existingBooking.paketLuarKota?.estimasiDurasi ||
        existingBooking.fasilitas?.customRute?.[0]?.estimasiDurasi ||
        (existingBooking.fasilitas?.jenisFasilitas ===
        JenisFasilitasEnum.DROPOFF
          ? 1
          : 0);
      if (existingDuration) {
        updatedTanggalSelesaiWisata = new Date(updatedTanggalMulaiWisata);
        updatedTanggalSelesaiWisata.setDate(
          updatedTanggalMulaiWisata.getDate() + existingDuration - 1,
        );
      } else {
        updatedTanggalSelesaiWisata = updatedTanggalMulaiWisata; // Fallback for 1-day services
      }
    }

    const dataToUpdate: Prisma.BookingUpdateInput = {
      tanggalMulaiWisata: updatedTanggalMulaiWisata,
      tanggalSelesaiWisata: updatedTanggalSelesaiWisata,
      jumlahPeserta: dto.jumlahPeserta,
      inputCustomTujuan: dto.inputCustomTujuan,
      catatanKhusus: dto.catatanKhusus,
      estimasiHarga: newEstimasiHarga,
      statusBooking: dto.statusBooking,
    };

    // ... (rest of the update logic, which seems okay)

    if (dto.supirId !== undefined) {
      if (dto.supirId === null) {
        throw new BadRequestException('Supir ID cannot be null.');
      }
      dataToUpdate.supir = { connect: { supirId: dto.supirId } };
    }
    if (dto.armadaId !== undefined) {
      if (dto.armadaId === null) {
        throw new BadRequestException('Armada ID cannot be null.');
      }
      dataToUpdate.armada = { connect: { armadaId: dto.armadaId } };
    }

    if (connectDisconnectPaket) {
      dataToUpdate.paket = connectDisconnectPaket;
    }
    if (connectDisconnectPaketLuarKota) {
      dataToUpdate.paketLuarKota = connectDisconnectPaketLuarKota;
    }
    if (connectDisconnectFasilitas) {
      dataToUpdate.fasilitas = connectDisconnectFasilitas;
    }

    if (dto.paketId !== undefined && dto.paketId !== null) {
      dataToUpdate.paketLuarKota = { disconnect: true };
      dataToUpdate.fasilitas = { disconnect: true };
    } else if (
      dto.paketLuarKotaId !== undefined &&
      dto.paketLuarKotaId !== null
    ) {
      dataToUpdate.paket = { disconnect: true };
      dataToUpdate.fasilitas = { disconnect: true };
    } else if (dto.fasilitasId !== undefined && dto.fasilitasId !== null) {
      dataToUpdate.paket = { disconnect: true };
      dataToUpdate.paketLuarKota = { disconnect: true };
    }

    try {
      return await this.prisma.booking.update({
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
    } catch (error) {
      console.error(`Prisma error updating booking with ID ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Booking with ID ${id} not found.`);
        }
        if (
          error.code === 'P2002' &&
          error.meta?.target === 'Booking_kode_booking_key'
        ) {
          throw new BadRequestException(
            'Booking code conflict during update. This should not happen if code is auto-generated.',
          );
        }
      }
      throw error;
    }
  }

  // --- Metode lainnya (findAll, findOne, findBookingsByUserId, removeBooking) tetap seperti semula ---

  async findAllBookings(): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      include: {
        user: { select: { namaLengkap: true, email: true } },
        paket: { select: { namaPaket: true, lokasi: true } },
        paketLuarKota: { select: { namaPaket: true, tujuanUtama: true } },
        fasilitas: {
          select: {
            namaFasilitas: true,
            jenisFasilitas: true,
          },
        },
        supir: { select: { nama: true } },
        armada: { select: { platNomor: true } },
        // PERBAIKAN: Sertakan data reschedule
        reschedules: {
          where: { status: 'pending' }, // Sertakan hanya yang statusnya pending
          select: {
            rescheduleId: true,
            tanggalBaru: true,
            alasan: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  // async findOneBooking(id: number): Promise<Booking | null> {
  //   return this.prisma.booking.findUnique({
  //     where: { bookingId: id },
  //     include: {
  //       user: true,
  //       paket: true,
  //       paketLuarKota: true,
  //       fasilitas: {
  //         // PERBAIKAN: Gunakan `select` untuk mengambil data yang diperlukan
  //         select: {
  //           fasilitasId: true,
  //           namaFasilitas: true,
  //           jenisFasilitas: true,
  //           // Relasi satu-ke-satu, jadi cukup `true`
  //           dropoff: true,
  //           // Relasi satu-ke-banyak, ambil elemen pertama
  //           customRute: { take: 1 },
  //           // Relasi satu-ke-satu, jadi cukup `true`
  //           paketLuarKota: true,
  //         }
  //       },
  //       supir: true,
  //       armada: true,
  //     },
  //   });
  // }

  // async findBookingsByUserId(userId: number) {
  //   try {
  //     const bookings = await this.prisma.booking.findMany({
  //       where: { userId: userId },
  //       include: {
  //         paket: { select: { namaPaket: true, lokasi: true, fotoPaket: true } },
  //         paketLuarKota: { select: { tujuanUtama: true, namaPaket: true } },
  //         reschedules: {
  //           // Hanya ambil status dari permintaan reschedule
  //           select: { status: true },
  //           // Anda bisa menambahkan filter jika hanya ingin yang 'pending'
  //           // where: { status: 'pending' }
  //         },
  //         fasilitas: {
  //           select: {
  //             namaFasilitas: true,
  //             jenisFasilitas: true,
  //             dropoff: { select: { namaTujuan: true, alamatTujuan: true } },
  //             customRute: { select: { tujuanList: true, catatanKhusus: true } },
  //             paketLuarKota: { select: { namaPaket: true, tujuanUtama: true } },
  //           },
  //         },
  //         supir: { select: { nama: true, nomorHp: true } },
  //         armada: { select: { jenisMobil: true, platNomor: true } },
  //         pembayaran: {select :{
  //            pesananId: true
  //          }}
  //       },
  //       orderBy: { tanggalBooking: 'desc' },
  //     });
  //     return bookings;
  //   } catch (error) {
  //     console.error('Error finding bookings by user ID:', error);
  //     throw new Error('Failed to retrieve user bookings');
  //   }
  // }

  async removeBooking(id: number): Promise<boolean> {
    try {
      const result = await this.prisma.booking.delete({
        where: { bookingId: id },
      });
      return result !== null;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Booking with ID ${id} not found.`);
      }
      console.error(`Error deleting booking with ID ${id}:`, error);
      throw error;
    }
  }

  private generateUniqueBookingCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `BKG-${timestamp}-${random}`.toUpperCase();
  }

  async findBookingsByUserId(userId: number) {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { userId: userId },
        include: {
          paket: { select: { namaPaket: true, lokasi: true, fotoPaket: true } },
          paketLuarKota: { select: { tujuanUtama: true, namaPaket: true } },
          reschedules: {
            select: { status: true },
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
          supir: { select: { nama: true, nomorHp: true } },
          armada: { select: { jenisMobil: true, platNomor: true } },
          // ⭐ PERBAIKAN: Ganti pesananId dengan pembayaranId
          pembayaran: {
            select: {
              pembayaranId: true, // ✅ Ini yang benar
              metodePembayaran: true,
              jumlahBayar: true,
              tanggalPembayaran: true,
              buktiPembayaran: true,
              statusPembayaran: true,
              // pesananId: true,        // ❌ Hapus ini - tidak relevan untuk refund
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

  // ========== SOLUSI 2: PERBAIKI findOneBooking() UNTUK REFUND ==========

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
        // ⭐ TAMBAHKAN: Include pembayaran untuk refund
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

  // ========== SOLUSI 3: BUAT METHOD KHUSUS UNTUK REFUND ==========

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
        // ⭐ PENTING: Include pembayaran lengkap untuk refund
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
        // Include refund existing (jika ada)
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
  private calculateDaysDifference(
    startDate: Date,
    endDate: Date,
  ): number {
    const msInDay = 1000 * 60 * 60 * 24;

    const cleanStartDate = new Date(startDate.toDateString());
const cleanEndDate = new Date(endDate.toDateString());


    
    // ⭐ PERBAIKAN: Gunakan metode UTC untuk memastikan perhitungan TIDAK dipengaruhi oleh zona waktu lokal server.
    
    // Tanggal Booking (Start Date) - dijadikan start hari di UTC
    const startUTC = Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
    );

    // Tanggal Pengajuan (End Date) - dijadikan start hari di UTC
    const endUTC = Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate()
    );
    
    // Hitung selisih hari penuh
    // Perhitungan: (5 Okt 00:00 UTC) - (3 Okt 00:00 UTC) = 2 hari
    const daysDiff = Math.floor((startUTC - endUTC) / msInDay);
    
    return daysDiff;
  }
  

  async checkRefundEligibility(bookingId: number): Promise<{
    eligible: boolean;
    reason?: string;
    booking?: any;
  }> {
    const booking = await this.findBookingForRefund(bookingId);

    if (!booking) {
      return { eligible: false, reason: 'Booking tidak ditemukan' };
    }

    // ⭐ Peraturan: Refund hanya bisa diajukan minimal H-3 (3 hari atau lebih)
    const MIN_DAYS_FOR_REFUND = 3; 

    // Menggunakan helper yang sudah didefinisikan untuk perhitungan hari penuh
    // const now = new Date();
    // const daysDiff = this.calculateDaysDifference(
    //   booking.tanggalMulaiWisata,
    //   now,
    // );

    const now = new Date();
    const daysDiff = this.calculateDaysDifference(booking.tanggalMulaiWisata, now);
console.log("Tanggal Mulai Wisata (T):", booking.tanggalMulaiWisata.toISOString());
console.log("Tanggal Pengajuan (R):", now.toISOString());
console.log("Selisih Hari (daysDiff):", daysDiff);
    
    // Tambahkan validasi status booking yang diperbolehkan (opsional, tapi baik)
    if (booking.statusBooking !== BookingStatus.CONFIRMED) {
        return { 
            eligible: false, 
            reason: 'Refund hanya bisa diajukan untuk booking yang sudah Dikonfirmasi atau Terverifikasi Pembayaran.' 
        };
    }

    // Cek apakah selisih hari kurang dari 3
    if (daysDiff < MIN_DAYS_FOR_REFUND) {
      // ⭐⭐ PERBAIKAN UTAMA: LEMPAR EXCEPTION di sini ⭐⭐
      throw new BadRequestException(
        `Pengajuan refund harus dilakukan minimal H-${MIN_DAYS_FOR_REFUND} (3 hari) sebelum tanggal wisata. Selisih hari saat ini: ${daysDiff} hari.`,
      );
    }


    // Jika daysDiff >= 3, maka eligible
    return { eligible: true, booking };
  }
}
