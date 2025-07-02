// src/modules/armada/armada.module.ts
import { Module } from '@nestjs/common';
import { ArmadaController } from 'src/controllers/armada.controller'; 
import { ArmadaService } from '../../services/armada.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArmadaController],
  providers: [ArmadaService],
  exports: [ArmadaService],
})
export class ArmadaModule {}