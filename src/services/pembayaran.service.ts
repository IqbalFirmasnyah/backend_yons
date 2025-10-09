import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MidtransService, CreateTransactionDto } from './midtrans.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private midtransService: MidtransService,
  ) {}

  // --- Kode dari src/services/pembayaran.service.ts (kode yang sudah diperbaiki) ---

  async createPaymentForBooking(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findFirst({
      where: { bookingId, userId },
      include: {
        user: true,
        paket: true,
        paketLuarKota: true,
        fasilitas: {
          include: {
            customRute: true,
            dropoff: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const orderId = `${booking.bookingId}-${this.makeid(5)}`;
    const itemDetails: {
      id: string;
      price: number;
      quantity: number;
      name: string;
    }[] = [];
    let serviceName = '';

    if (booking.paket) {
      serviceName = booking.paket.namaPaket;
      itemDetails.push({
        id: `paket-${booking.paket.paketId}`,
        price: Number(booking.estimasiHarga),
        quantity: 1,
        name: booking.paket.namaPaket,
      });
    } else if (booking.paketLuarKota) {
      serviceName = booking.paketLuarKota.namaPaket;
      itemDetails.push({
        id: `paket-luar-kota-${booking.paketLuarKota.paketLuarKotaId}`,
        price: Number(booking.estimasiHarga),
        quantity: 1,
        name: booking.paketLuarKota.namaPaket,
      });
    } else if (booking.fasilitas) {
      serviceName = booking.fasilitas.namaFasilitas;
      itemDetails.push({
        id: `fasilitas-${booking.fasilitas.fasilitasId}`,
        price: Number(booking.estimasiHarga),
        quantity: 1,
        name: booking.fasilitas.namaFasilitas,
      });
    }
    const transactionData: CreateTransactionDto = {
      orderId,
      grossAmount: Number(booking.estimasiHarga),
      customerDetails: {
        firstName: booking.user.namaLengkap.split(' ')[0],
        lastName:
          booking.user.namaLengkap.split(' ').slice(1).join(' ') || undefined,
        email: booking.user.email,
        phone: booking.user.noHp,
      },
      itemDetails,
      customExpiry: {
        expiry_duration: 24,
        unit: 'hour',
      },
    };

    const snapTransaction =
      await this.midtransService.createSnapTransaction(transactionData);
    const payment = await this.prisma.pembayaran.create({
      data: {
        userId,
        bookingId: booking.bookingId,
        metodePembayaran: 'midtrans',
        jumlahBayar: booking.estimasiHarga,
        tanggalPembayaran: new Date(),
        statusPembayaran: 'pending',
        buktiPembayaran: JSON.stringify({
          orderId,
          snapToken: snapTransaction.token,
          redirectUrl: snapTransaction.redirect_url,
        }),
      },
    });
    await this.prisma.booking.update({
      where: { bookingId },
      data: { statusBooking: 'pending_payment' },
    });

    return {
      paymentId: payment.pembayaranId,
      snapToken: snapTransaction.token,
      redirectUrl: snapTransaction.redirect_url,
      orderId,
    };
  }

  private makeid(length: number) {
    var result = '';
    var characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  async handleWebhookNotification(webhookData: any) {
    console.log('webhookData: ', webhookData);
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
      transaction_id,
      transaction_time,
    } = webhookData;

    this.logger.log(
      `[Webhook] Received Midtrans webhook: ${JSON.stringify(webhookData)}`,
    );

    // Verify signature
    const isSignatureValid = this.midtransService.verifyWebhookSignature(
      order_id,
      status_code,
      gross_amount,
      signature_key,
    );

    if (!isSignatureValid) {
      this.logger.warn(`Invalid signature for order ${order_id}`);
      return { success: false, message: 'Invalid signature' };
    }

    // Find payment record
    const payment = await this.prisma.pembayaran.findFirst({
      where: {
        buktiPembayaran: {
          contains: order_id,
        },
      },
      include: {
        user: true,
      },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for order ${order_id}`);
      return { success: false, message: 'Payment not found' };
    }

    let newStatus = 'pending';
    let bookingStatus = 'pending_payment';

    // Map Midtrans status to our payment status
    switch (transaction_status) {
      case 'capture':

      case 'settlement':
        newStatus = 'verified';
        bookingStatus = 'payment_verified';
        break;
      case 'pending':
        newStatus = 'pending';
        bookingStatus = 'pending_payment';
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
      case 'failure':
        newStatus = 'rejected';
        bookingStatus = 'expired';
        break;
      default: // Tambahkan default case untuk status yang tidak terduga
        this.logger.warn(
          `[Webhook] Unhandled transaction_status: ${transaction_status} for order ${order_id}`,
        );
        newStatus = 'unknown'; // Atau status lain yang sesuai
        bookingStatus = 'unknown_status'; // Atau status lain yang sesuai
        break;
    }

    // Update payment status
    await this.prisma.pembayaran.update({
      where: { pembayaranId: payment.pembayaranId },
      data: {
        statusPembayaran: newStatus,
        buktiPembayaran: JSON.stringify({
          ...JSON.parse(payment.buktiPembayaran || '{}'),
          midtransResponse: {
            transaction_id,
            transaction_status,
            payment_type,
            transaction_time,
            status_code,
          },
        }),
      },
    });

    // Find and update related booking
    const booking = await this.prisma.booking.findFirst({
      where: {
        userId: payment.userId,
        statusBooking: 'pending_payment',
        estimasiHarga: payment.jumlahBayar,
      },
    });

    if (booking) {
      await this.prisma.booking.update({
        where: { bookingId: booking.bookingId },
        data: { statusBooking: bookingStatus },
      });

      // Create status update record
      await this.prisma.updateStatusBooking.create({
        data: {
          bookingId: booking.bookingId,
          statusLama: 'pending_payment',
          statusBaru: bookingStatus,
          keterangan: `Payment ${transaction_status} via Midtrans`,
          timestampUpdate: new Date(),
        },
      });

      // Create notification
      await this.prisma.notifikasi.create({
        data: {
          userId: payment.userId,
          bookingId: booking.bookingId,
          tipeNotifikasi: 'payment_update',
          judulNotifikasi: `Payment ${transaction_status}`,
          deskripsi: `Your payment for booking ${booking.kodeBooking} has been ${transaction_status}`,
          tanggalNotifikasi: new Date(),
        },
      });
    }

    this.logger.log(
      `Payment webhook processed for order ${order_id}: ${transaction_status}`,
    );

    return {
      success: true,
      message: 'Webhook processed successfully',
      paymentStatus: newStatus,
    };
  }

  async getPaymentStatus(paymentId: number, userId: number) {
    const payment = await this.prisma.pembayaran.findFirst({
      where: { pembayaranId: paymentId, userId },
      include: {
        user: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const buktiData = JSON.parse(payment.buktiPembayaran || '{}');

    if (buktiData.orderId) {
      // Get latest status from Midtrans
      try {
        const midtransStatus = await this.midtransService.getTransactionStatus(
          buktiData.orderId,
        );

        // Update local status if different
        if (
          midtransStatus.transaction_status !==
          buktiData.midtransResponse?.transaction_status
        ) {
          await this.handleWebhookNotification({
            order_id: buktiData.orderId,
            status_code: midtransStatus.status_code,
            gross_amount: midtransStatus.gross_amount,
            signature_key: midtransStatus.signature_key,
            transaction_status: midtransStatus.transaction_status,
            payment_type: midtransStatus.payment_type,
            transaction_id: midtransStatus.transaction_id,
            transaction_time: midtransStatus.transaction_time,
          });
        }
      } catch (error) {
        this.logger.error('Error getting Midtrans status:', error);
      }
    }

    return payment;
  }
}
