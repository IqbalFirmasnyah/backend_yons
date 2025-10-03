import { Module } from '@nestjs/common';
import { CustomRuteFasilitasController } from 'src/controllers/custom-rute-fasilitas.controller';
import { CustomRuteFasilitasService } from 'src/services/custom-rute-fasilitas.service'; 
import { PrismaService } from 'src/prisma/prisma.service'; 
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { OsmModule } from '../osm/osm.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        OsmModule
      ],
  controllers: [CustomRuteFasilitasController],
  providers: [CustomRuteFasilitasService, PrismaService],
  exports: [CustomRuteFasilitasService], // Export if needed by other modules
})
export class CustomRuteFasilitasModule {}