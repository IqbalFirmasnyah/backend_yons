// src/notification/subscription.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
import { SubscriptionService } from 'src/services/notification/subscription.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import * as webpush from 'web-push';

@ApiTags('Subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Menyimpan Web Push Subscription pengguna' })
  @ApiBody({ 
      description: 'Objek PushSubscription dari browser', 
      schema: { 
          example: { endpoint: '...', expirationTime: null, keys: { p256dh: '...', auth: '...' } } 
      } 
  })
  async saveSubscription(@Body() subscription: webpush.PushSubscription, @Req() req: any) {
    const userId = req.user.id.toString(); // Ambil ID user dari token
    await this.subscriptionService.saveSubscription(userId, subscription);
    return { success: true, message: 'Subscription berhasil disimpan.' };
  }
}