import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { PushNotificationService } from 'src/services/notification/push.service';
import { SubscriptionService } from 'src/services/notification/subscription.service';
import { JwtModule } from '@nestjs/jwt'; // Diperlukan oleh NotificationGateway
import { ConfigModule } from '@nestjs/config'; // Diperlukan oleh NotificationGateway

@Module({
  imports: [
    // Pastikan module-module yang dibutuhkan (seperti untuk JWT/Config) juga diimport
    ConfigModule,
    // JwtModule harus dikonfigurasi agar NotificationGateway bisa menggunakan JwtService
    JwtModule
  ],
  providers: [
    NotificationGateway, // <-- Daftar sebagai provider
    PushNotificationService, // <-- Daftar sebagai provider
    SubscriptionService, // <-- Daftar sebagai provider
  ],
  exports: [
    NotificationGateway, // <-- PENTING: Export agar bisa di-inject di module lain
    PushNotificationService, // <-- PENTING
    SubscriptionService, // <-- PENTING
  ],
})
export class NotificationModule {}