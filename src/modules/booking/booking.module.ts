import { Module } from '@nestjs/common';
import { BookingService } from 'src/services/booking.service'; 
import { BookingController } from 'src/controllers/booking.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; 
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from 'src/notification/notification.module';
import { ArmadaModule } from '../armada/armada.module';
import { DropoffModule } from '../dropoff/dropoff.module';
import { SupirModule } from '../supir/supir.module';
import { CustomRuteFasilitasModule } from '../custom-rute-fasilitas/custom-rute-fasilitas.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NotificationModule,
    DropoffModule, 
    ArmadaModule, 
    SupirModule,
    CustomRuteFasilitasModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}