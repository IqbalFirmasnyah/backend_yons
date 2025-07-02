import { Module } from '@nestjs/common';
import { PaketWisataLuarKotaService } from 'src/services/paket_wisata_luar.service'; 
import { PaketWisataLuarKotaController } from 'src/controllers/paket_wisata_luar.controller'; 
import { PrismaModule } from 'src/prisma/prisma.module'; 

@Module({
  imports: [PrismaModule],
  controllers: [PaketWisataLuarKotaController],
  providers: [PaketWisataLuarKotaService],
  exports: [PaketWisataLuarKotaService],
})
export class PaketWisataLuarKotaModule {}