import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from 'src/controllers/pembayaran.controller'; 
import { PaymentService } from 'src/services/pembayaran.service';
import { MidtransService } from 'src/services/midtrans.service'; 
import { PrismaModule } from 'src/prisma/prisma.module'; 
import midtransConfig from 'src/config/midtrans.config';

@Module({
  imports: [
    ConfigModule.forFeature(midtransConfig),
    PrismaModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, MidtransService],
  exports: [PaymentService, MidtransService],
})
export class PaymentModule {}