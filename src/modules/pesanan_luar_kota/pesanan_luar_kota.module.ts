// src/paket-wisata/paket_wisata.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PesananLuarKotaService } from 'src/services/pesanan_luar_kota.service'; 
import { PesananLuarKotaController } from 'src/controllers/pesanan_luar_kota.controller'; 


@Module({
    imports: [PrismaModule],
    controllers: [PesananLuarKotaController],
    providers: [PesananLuarKotaService],
    exports: [PesananLuarKotaService]
  })
export class PesananLuarKotaModule {}

