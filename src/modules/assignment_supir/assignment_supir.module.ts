// src/assignment-supir/assignment-supir.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AssignmentSupirArmadaController } from 'src/controllers/assignment_supir.controller';
import { AssignmentSupirArmadaService } from 'src/services/assignment_supir.service';
import { AssignmentSupirArmada } from 'src/database/entities/assigment_supir_armada.entity';
import { SupirModule } from '../supir/supir.module'; 
import { ArmadaModule } from '../armada/armada.module'; 

@Module({
    imports: [PrismaModule],
    controllers: [AssignmentSupirArmadaController],
    providers: [AssignmentSupirArmadaService],
    exports: [AssignmentSupirArmadaService],
  })
export class AssignmentSupirModule {}

