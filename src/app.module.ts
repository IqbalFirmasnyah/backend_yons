import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/strategies/jwt_auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { ArmadaModule } from './modules/armada/armada.module'; 
import { PaketWisataModule } from './modules/paket_wisata/paket_wisata.module'; 
import { PaketWisataLuarKotaModule } from './modules/paket_luar_kota/paket_luar_kota.module'; 
import { PesananModule } from './modules/pesanan/pesanan.module'; 
import { PesananLuarKotaModule } from './modules/pesanan_luar_kota/pesanan_luar_kota.module'; 
import { SupirModule } from './modules/supir/supir.module';
import { AssignmentSupirModule } from './modules/assignment_supir/assignment_supir.module';
import { UpdateStatusBookingModule } from './modules/status_booking/status_booking.module';
import { BookingModule } from './modules/booking/booking.module';
import { RefundModule } from './modules/refund/refund.module';
import { UserModule } from './modules/users/users.module';
import { DetailRuteModule } from './modules/detailRute/detail_rute.modul';
import { NotifikasiModule } from './modules/notifikasi/notifikasi.module';
import { AdminModule } from './modules/admin/admin.module';
import { PembayaranModule } from './modules/pembayaran/pembayaran.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ArmadaModule,
    PaketWisataModule,
    PaketWisataLuarKotaModule,
    PesananModule,
    PesananLuarKotaModule,
    SupirModule,
    AssignmentSupirModule,
    UpdateStatusBookingModule,
    BookingModule,
    RefundModule,
    UserModule,
    DetailRuteModule,
    NotifikasiModule,
    AdminModule,
    PembayaranModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}