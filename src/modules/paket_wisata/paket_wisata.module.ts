// src/paket-wisata/paket_wisata.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaketWisataService } from 'src/services/paket_wisata.service'; 
import { PaketWisataController } from 'src/controllers/paket_wisata.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
    imports: [
        PrismaModule,
        AuthModule
      ],
    controllers: [PaketWisataController],
    providers: [PaketWisataService],
    exports: [PaketWisataService]
  })
export class PaketWisataModule {}