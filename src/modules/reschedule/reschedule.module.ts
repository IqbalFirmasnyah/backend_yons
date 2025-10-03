import { Module } from '@nestjs/common';
import { RescheduleService } from 'src/services/reschedule.service';
import { RescheduleController } from 'src/controllers/reschedule.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RescheduleController],
  providers: [RescheduleService],
})
export class RescheduleModule {}