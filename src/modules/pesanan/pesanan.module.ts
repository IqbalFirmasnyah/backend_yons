import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PesananService } from 'src/services/pesanan.service'; 
import { PesananController } from 'src/controllers/pesanan.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PesananController],
  providers: [PesananService],
  exports: [PesananService]
})
export class PesananModule {}