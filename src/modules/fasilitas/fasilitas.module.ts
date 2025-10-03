import { Module } from '@nestjs/common';
import { FasilitasController } from 'src/controllers/fasilitas.controller';
import { FasilitasService } from 'src/services/fasilitas.service'; 
import { PrismaService } from 'src/prisma/prisma.service'; 
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule
      ],
  controllers: [FasilitasController],
  providers: [FasilitasService, PrismaService],
  exports: [FasilitasService], // Export if needed by other modules
})
export class FasilitasModule {}