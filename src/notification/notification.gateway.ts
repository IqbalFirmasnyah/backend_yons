import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: ['http://localhost:3000'], credentials: true },
  transports: ['websocket', 'polling'],
  path: '/socket.io',
})
export class NotificationGateway {
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // client akan kirim { token }
  @SubscribeMessage('register')
  async onRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token?: string },
  ) {
    try {
      const raw = (data?.token ?? '').replace(/^Bearer\s+/i, '');
      if (!raw) {
        client.emit('register.error', { message: 'no token provided' });
        return;
      }

      const secret = this.config.get<string>('JWT_ACCESS_SECRET')!;
      const payload = this.jwt.verify(raw, { secret }); // throw kalau salah/expired
      const userId = payload.sub ?? payload.id ?? payload.userId;
      if (!userId) throw new Error('no user id claim in token');

      const room = `user:${userId}`;
      client.join(room);
      client.emit('registered', { room });
      console.log('[WS] register OK =>', room);
    } catch (e: any) {
      console.error('[WS] register failed:', e);
      client.emit('register.error', { message: e?.message || 'invalid token' });
    }
  }

  // helper kirim event ke user
  emitToUser(userId: number | string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  bookingStatusChanged(userId: number, payload: { bookingId: number; newStatus: string; updatedAt: string; }) {
    this.emitToUser(userId, 'booking.status.changed', payload);
  }
  bookingRescheduled(userId: number, payload: { bookingId: number; newDate: string; updatedAt: string; }) {
    this.emitToUser(userId, 'booking.rescheduled', payload);
  }
  bookingRefunded(userId: number, payload: { bookingId: number; refundId: number; status: string; updatedAt: string; amount?: number; }) {
    this.emitToUser(userId, 'booking.refunded', payload);
  }

  
}
