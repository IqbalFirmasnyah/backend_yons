// src/modules/armada/armada.module.ts
import { Module } from '@nestjs/common';
import { AdminController } from 'src/controllers/admin.controller'; 
import { AdminService } from 'src/services/admin.service'; 
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}