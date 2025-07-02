import { Module } from '@nestjs/common';
import { NotifikasiController } from 'src/controllers/notifikasi.controller'; 
import { NotifikasiService } from 'src/services/notifikasi.service'; 
import { PrismaModule } from 'src/prisma/prisma.module'; 

@Module({
  imports: [PrismaModule],
  controllers: [NotifikasiController],
  providers: [NotifikasiService],
  exports: [NotifikasiService],
})
export class NotifikasiModule {}