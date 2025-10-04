// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

import { NotificationGateway } from './notification.gateway';
import { PushController } from 'src/controllers/notification.controller';
import { PushNotificationService } from 'src/services/notification/push-notification.service';
import { WsTestController } from 'src/controllers/ws-test.controller';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [PushController, WsTestController],
  providers: [NotificationGateway, PushNotificationService],
  exports: [NotificationGateway, PushNotificationService],
})
export class NotificationModule {}
