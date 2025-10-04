// src/notifikasi/notifikasi.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { NotificationModule } from 'src/notification/notification.module';
import { PushController } from 'src/controllers/notification.controller';

@Module({
  imports: [forwardRef(() => NotificationModule)], // <<< supaya dapat PushNotificationService
  controllers: [PushController],                   // <<< controller hanya di sini
})
export class NotifikasiModule {}
