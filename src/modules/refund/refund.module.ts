import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { Refund } from 'src/database/entities/refund.entity';
import { RefundService } from 'src/services/refund.service';
import { RefundController } from 'src/controllers/refund.controller';
import { BookingModule } from '../booking/booking.module';
import { AuthModule } from 'src/auth/auth.module';


@Module({
    imports: [
        PrismaModule,
        AuthModule,
        BookingModule
      ],
    controllers: [RefundController],
    providers: [RefundService],
    exports: [RefundService]
  })
export class RefundModule {}


