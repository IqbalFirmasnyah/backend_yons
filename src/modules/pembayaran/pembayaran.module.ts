import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PembayaranService } from 'src/services/pembayaran.service'; 
import { PembayaranController } from 'src/controllers/pembayaran.controller'; 

@Module({
  imports: [PrismaModule],
  controllers: [PembayaranController],
  providers: [PembayaranService],
  exports: [PembayaranService]
})
export class PembayaranModule {}