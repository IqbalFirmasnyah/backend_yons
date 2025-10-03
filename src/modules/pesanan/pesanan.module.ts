import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PesananService } from 'src/services/pesanan.service'; 
import { PesananController } from 'src/controllers/pesanan.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule
  ],
  controllers: [PesananController],
  providers: [PesananService],
  exports: [PesananService]
})
export class PesananModule {}