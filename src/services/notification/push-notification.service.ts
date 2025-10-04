import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from 'src/prisma/prisma.service';
import { PushSubscriptionDto } from 'src/dto/push-subscription.dto';

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, any>;
};

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const subject = this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@example.com';
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');

    if (!publicKey || !privateKey) {
      this.logger.error('VAPID keys are missing. Set VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY.');
      return;
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }

  getPublicKey() {
    const k = this.config.get<string>('VAPID_PUBLIC_KEY');
    if (!k) throw new Error('VAPID_PUBLIC_KEY is not set');
    return k;
  }

  async saveSubscription(userId: number, dto: PushSubscriptionDto) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: {
        userId,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
      },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
      },
    });
  }

  async removeSubscription(endpoint: string) {
    try {
      await this.prisma.pushSubscription.delete({ where: { endpoint } });
      return true;
    } catch {
      return false;
    }
  }

  private async pushToEndpoint(
    sub: { endpoint: string; p256dh: string; auth: string },
    payload: PushPayload,
  ) {
    try {
      const subscription: webpush.PushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      } as any;

      await webpush.sendNotification(subscription, JSON.stringify(payload), {
        TTL: 60,
        urgency: 'high',
      });
    } catch (err: any) {
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        this.logger.warn(`Stale endpoint, removing: ${sub.endpoint}`);
        await this.removeSubscription(sub.endpoint);
      } else {
        this.logger.error(`webpush error: ${err?.statusCode || ''} ${err?.message || err}`);
      }
    }
  }

  async pushToUser(userId: number, payload: PushPayload) {
    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
      select: { endpoint: true, p256dh: true, auth: true },
    });
    if (!subs.length) return { delivered: 0 };

    await Promise.all(subs.map((s) => this.pushToEndpoint(s, payload)));
    return { delivered: subs.length };
  }

  // ==== helper untuk event booking/refund/reschedule ====
  async bookingStatusChanged(
    userId: number,
    p: { bookingId: number; newStatus: string; updatedAt: string },
  ) {
    return this.pushToUser(userId, {
      title: `Status Booking #${p.bookingId}`,
      body: `${p.newStatus.toUpperCase()} • ${new Date(p.updatedAt).toLocaleString('id-ID')}`,
      url: `/user/bookings/${p.bookingId}`,
      data: { type: 'booking.status.changed', ...p },
    });
  }

  async bookingRescheduled(
    userId: number,
    p: { bookingId: number; newDate: string; updatedAt: string; status?: string },
  ) {
    return this.pushToUser(userId, {
      title: `Reschedule Booking #${p.bookingId}${p.status ? ` (${p.status.toUpperCase()})` : ''}`,
      body: `Jadwal baru: ${new Date(p.newDate).toLocaleString('id-ID')} • ${new Date(p.updatedAt).toLocaleString('id-ID')}`,
      url: `/user/bookings/${p.bookingId}`,
      data: { type: 'booking.rescheduled', ...p },
    });
  }

  async bookingRefunded(
    userId: number,
    p: { bookingId: number; refundId: number; status: string; updatedAt: string; amount?: number },
  ) {
    return this.pushToUser(userId, {
      title: `Refund Booking #${p.bookingId}`,
      body: `${p.status.toUpperCase()}${p.amount ? ` • Rp${p.amount.toLocaleString('id-ID')}` : ''} • ${new Date(p.updatedAt).toLocaleString('id-ID')}`,
      url: `/user/refunds/${p.refundId}`,
      data: { type: 'booking.refunded', ...p },
    });
  }
}
