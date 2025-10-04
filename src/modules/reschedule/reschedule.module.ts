import { Module } from '@nestjs/common';
import { RescheduleService } from 'src/services/reschedule.service';
import { RescheduleController } from 'src/controllers/reschedule.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [PrismaModule, AuthModule,NotificationModule],
  controllers: [RescheduleController],
  providers: [RescheduleService],
})
export class RescheduleModule {}