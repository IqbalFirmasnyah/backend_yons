// src/controllers/notifikasi.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { PushNotificationService } from 'src/services/notification/push-notification.service';

@Controller('ws-test')
export class WsTestController {
  constructor(
    private readonly gateway: NotificationGateway,
    private readonly push: PushNotificationService,
  ) {}

  @Post('status-changed')
  statusChanged(@Body() b: { userId: number; bookingId: number; newStatus: string }) {
    const payload = { bookingId: b.bookingId, newStatus: b.newStatus, updatedAt: new Date().toISOString() };
    console.log('[WS-TEST] status-changed →', b.userId, payload);
    this.gateway.bookingStatusChanged(b.userId, payload);
    this.push.bookingStatusChanged(b.userId, payload);
    return { ok: true, sent: payload };
  }

  @Post('rescheduled')
  rescheduled(@Body() b: { userId: number; bookingId: number; newDate: string; status?: string }) {
    const payload = { bookingId: b.bookingId, newDate: b.newDate, status: b.status ?? 'approved', updatedAt: new Date().toISOString() };
    console.log('[WS-TEST] rescheduled →', b.userId, payload);
    this.gateway.bookingRescheduled(b.userId, payload);
    this.push.bookingRescheduled(b.userId, payload);
    return { ok: true, sent: payload };
  }

  @Post('refunded')
  refunded(@Body() b: { userId: number; bookingId: number; refundId: number; status: string; amount?: number }) {
    const payload = { bookingId: b.bookingId, refundId: b.refundId, status: b.status, amount: b.amount, updatedAt: new Date().toISOString() };
    console.log('[WS-TEST] refunded →', b.userId, payload);
    this.gateway.bookingRefunded(b.userId, payload);
    this.push.bookingRefunded(b.userId, payload);
    return { ok: true, sent: payload };
  }
}
