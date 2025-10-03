// src/notification/test.controller.ts

import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { AuthGuard } from '@nestjs/passport'; // Untuk melindungi endpoint
import { NotificationGateway } from "src/notification/notification.gateway";
import { GetUser } from "src/public/get_user.decorator";
import { SubscriptionService } from "src/services/notification/subscription.service";

// Asumsi tipe payload JWT Anda
interface UserPayload {
    id: string; // Properti yang memegang userId/adminId dari payload.sub
    // ... properti lain dari JwtStrategy return value
}


@Controller('test')
// Lindungi seluruh controller dengan JWT Guard
@UseGuards(AuthGuard('jwt')) 
export class TestController {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  // Endpoint yang mengirim notifikasi kepada pengguna yang SAMA dengan yang membuat request
  @Post('notify-self')
  triggerSelfNotification(@GetUser() user: UserPayload) {
    // ID diambil dari payload JWT yang sudah divalidasi
    const userId = user.id; 
    
    const data = { 
      message: `Notifikasi Test untuk ${userId} dipicu pada ${Date.now()}`,
      timestamp: Date.now() 
    };

    // Panggil method untuk mengirim ke room milik pengguna ini
    this.notificationGateway.sendNotificationToUser(userId, data); 
    
    return { success: true, message: `Notifikasi terkirim ke ${userId}` };
  }

  
}

