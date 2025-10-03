import { Module } from '@nestjs/common';
import { PaketWisataLuarKotaController } from 'src/controllers/paket_wisata_luar.controller';
import { PaketWisataLuarKotaService } from 'src/services/paket_wisata_luar.service'; 
import { PrismaService } from 'src/prisma/prisma.service'; 
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule
      ],
  controllers: [PaketWisataLuarKotaController],
  providers: [PaketWisataLuarKotaService, PrismaService],
  exports: [PaketWisataLuarKotaService], // Export if needed by other modules
})
export class PaketWisataLuarKotaModule {}