// src/controllers/notification.controller.ts
import { Body, Controller, Delete, Get, Post, Query, UseGuards, Req } from '@nestjs/common';
import { PushNotificationService } from 'src/services/notification/push-notification.service';
import { PushSubscriptionDto } from 'src/dto/push-subscription.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
import { Request } from 'express';

@Controller('notifications')
export class PushController {
  constructor(private push: PushNotificationService) {}

  @Get('vapid-public-key')
  getPublicKey() {
    return { publicKey: this.push.getPublicKey() };
  }

  // Simpan/Update subscription user yang sedang login
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  async subscribe(@Req() req: Request, @Body() dto: PushSubscriptionDto) {
    const user = req.user as any; // dari JwtStrategy.validate()
    await this.push.saveSubscription(Number(user.id), dto);
    return { ok: true };
  }

  // Hapus subscription berdasarkan endpoint
  @UseGuards(JwtAuthGuard)
  @Delete('unsubscribe')
  async unsubscribe(@Query('endpoint') endpoint: string) {
    if (!endpoint) return { ok: false, message: 'endpoint required' };
    const ok = await this.push.removeSubscription(endpoint);
    return { ok };
  }

  // Endpoint test kirim push ke user tertentu (mis. via Postman)
  // body: { userId: number, title: string, body: string, url?: string, data?: any }
  @Post('test')
  async test(@Body() b: { userId: number; title?: string; body?: string; url?: string; data?: any }) {
    const payload = {
      title: b.title ?? 'Test Push',
      body: b.body ?? 'Hello from server!',
      url: b.url,
      data: b.data,
    };
    return this.push.pushToUser(b.userId, payload);
  }
}
