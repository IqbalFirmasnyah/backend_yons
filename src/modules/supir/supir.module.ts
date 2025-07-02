import { Module } from '@nestjs/common';
import { SupirService } from 'src/services/supir.service'; 
import { SupirController } from 'src/controllers/supir.controller'; 
import { PrismaModule } from 'src/prisma/prisma.module'; 

@Module({
    imports: [PrismaModule],
    controllers: [SupirController],
    providers: [SupirService],
    exports: [SupirService]
  })
export class SupirModule {}

