import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as webpush from 'web-push';
import { ConfigService } from "@nestjs/config"; // Import ConfigService

interface PushPayload {
    title: string;
    body: string;
    data?: any;
}

@Injectable()
export class PushNotificationService {
  constructor(private readonly configService: ConfigService) { // Inject ConfigService
    // Set VAPID details dari environment variables
    const VAPID_PUBLIC_KEY = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE_KEY = this.configService.get<string>('VAPID_PRIVATE_KEY');

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn('VAPID keys tidak dikonfigurasi. Web Push tidak akan berfungsi.');
    }

    webpush.setVapidDetails(
      'mailto:adindaiqbal@gmail.com', 
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
  }

  async sendPushNotification(
      subscription: webpush.PushSubscription, 
      payload: PushPayload
  ) {
    try {
      // Kirim payload dalam bentuk JSON string
      await webpush.sendNotification(
        subscription, 
        JSON.stringify(payload)
      );
      console.log('Web Push berhasil dikirim.');
    } catch (error) {
      console.error('Web Push Gagal:', error);
      // PENTING: Jika error status 410 (Gone), Anda harus menghapus subscription ini dari DB
      if (error.statusCode === 410) {
        console.warn('Subscription tidak valid/kedaluwarsa (410 Gone). Perlu dihapus dari DB.');
        // TODO: Panggil method di SubscriptionService untuk menghapus subscription
      }
      throw new InternalServerErrorException('Gagal mengirim Web Push.');
    }
  }
}