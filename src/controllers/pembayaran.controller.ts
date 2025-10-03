import {
    Controller,
    Post,
    Body,
    Param,
    Get,
    UseGuards,
    Request,
    HttpStatus,
    HttpCode,
    Logger,
    BadRequestException, // Import BadRequestException untuk error yang lebih spesifik
    UnauthorizedException, // Bisa digunakan jika userId benar-benar tidak ada di token
  } from '@nestjs/common';
  import { PaymentService } from 'src/services/pembayaran.service'; 
  import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard'; 
import { Public } from 'src/public/public.decorator';
  
  @Controller('payment')
  export class PaymentController {
    private readonly logger = new Logger(PaymentController.name);
  
    constructor(private paymentService: PaymentService) {}
  
    
    @Public()
    @Post('webhook/midtrans')
    @HttpCode(HttpStatus.OK)
    async handleMidtransWebhook(@Body() webhookData: any) {
      this.logger.log('Received Midtrans webhook:', JSON.stringify(webhookData));
      
      try {
        const result = await this.paymentService.handleWebhookNotification(webhookData);
        return result;
      } catch (error) {
        this.logger.error('Error processing webhook:', error);
        // Mengembalikan respons error yang konsisten untuk webhook
        return { success: false, message: 'Webhook processing failed' };
      }
    }

    // @UseGuards(JwtAuthGuard)
    @Post('create/:bookingId')
    async createPayment(
      @Param('bookingId') bookingId: string,
      @Request() req: any, // req.user akan dipopulasi oleh JwtAuthGuard
    ) {
      // Log seluruh objek req.user untuk melihat strukturnya
      this.logger.debug(`[createPayment] Full req.user object: ${JSON.stringify(req.user)}`);
  
      // Asumsi userId ada di req.user.id setelah JwtAuthGuard
      // FIX: Mengubah req.user?.userId menjadi req.user?.id
      const userId = req.user?.id; // Gunakan optional chaining (?) untuk keamanan
  
      // Log nilai userId yang diekstrak
      this.logger.debug(`[createPayment] Extracted userId: ${userId}`);
  
      // Validasi userId: Jika userId tidak ada atau tidak valid, lempar error yang lebih spesifik
      if (!userId) {
        this.logger.error(`[createPayment] User ID is missing or invalid in JWT payload for bookingId: ${bookingId}. req.user: ${JSON.stringify(req.user)}`);
        // Memberikan error 400 Bad Request jika userId tidak ditemukan
        throw new BadRequestException('User ID is missing or invalid. Please ensure you are logged in correctly.');
      }
  
      // Pastikan bookingId di-parse sebagai integer dengan radix 10
      const parsedBookingId = parseInt(bookingId, 10);
      if (isNaN(parsedBookingId)) {
        this.logger.error(`[createPayment] Invalid bookingId provided: ${bookingId}`);
        throw new BadRequestException('Invalid Booking ID format.');
      }
  
      return await this.paymentService.createPaymentForBooking(
        parsedBookingId,
        userId,
      );
    }

    
  
    
  
    // @UseGuards(JwtAuthGuard)
    @Get('status/:paymentId')
    async getPaymentStatus(
      @Param('paymentId') paymentId: string,
      @Request() req: any,
    ) {
      // Log seluruh objek req.user untuk melihat strukturnya
      this.logger.debug(`[getPaymentStatus] Full req.user object: ${JSON.stringify(req.user)}`);
  
      // FIX: Mengubah req.user?.userId menjadi req.user?.id
      const userId = req.user?.id; // Gunakan optional chaining (?) untuk keamanan
  
      // Log nilai userId yang diekstrak
      this.logger.debug(`[getPaymentStatus] Extracted userId: ${userId}`);
  
      // Validasi userId
      if (!userId) {
        this.logger.error(`[getPaymentStatus] User ID is missing or invalid in JWT payload for paymentId: ${paymentId}. req.user: ${JSON.stringify(req.user)}`);
        throw new BadRequestException('User ID is missing or invalid. Please ensure you are logged in correctly.');
      }
  
      // Pastikan paymentId di-parse sebagai integer dengan radix 10
      const parsedPaymentId = parseInt(paymentId, 10);
      if (isNaN(parsedPaymentId)) {
        this.logger.error(`[getPaymentStatus] Invalid paymentId provided: ${paymentId}`);
        throw new BadRequestException('Invalid Payment ID format.');
      }
  
      return await this.paymentService.getPaymentStatus(
        parsedPaymentId,
        userId,
      );
    }
  }