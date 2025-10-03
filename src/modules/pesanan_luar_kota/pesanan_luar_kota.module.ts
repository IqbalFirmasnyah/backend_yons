import { Module } from '@nestjs/common';
import { PesananLuarKotaService } from 'src/services/pesanan_luar_kota.service'; 
import { PesananLuarKotaController } from 'src/controllers/pesanan_luar_kota.controller'; 
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module'; 

@Module({
  imports: [
    PrismaModule,
    AuthModule
  ],
  controllers: [PesananLuarKotaController],
  providers: [PesananLuarKotaService],
  exports: [PesananLuarKotaService],
})
export class PesananLuarKotaModule {}