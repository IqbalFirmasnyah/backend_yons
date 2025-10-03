// src/notification/notification.gateway.ts
import { 
  WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt'; 
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Opsional jika secret berbeda

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000' }, // Sesuaikan dengan domain frontend
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // Inject JwtService
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService 
    // Anda bisa inject PrismaService juga jika perlu fetch data user seperti di JwtStrategy
  ) {}

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      // 1. Dapatkan Token dari Header
      const token = client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        throw new UnauthorizedException('Token tidak ada.');
      }

      // 2. Verifikasi Token secara manual
      const secret = this.configService.get<string>('JWT_SECRET'); // Ambil secret
      const payload = await this.jwtService.verifyAsync(token, { secret }); 
      
      const userId = payload.sub; // Ambil ID dari 'sub' (subjek)

      if (!userId) {
        throw new UnauthorizedException('Payload token tidak valid.');
      }

      // 3. Simpan ID dan Tetapkan ke Room
      (client as any).userId = userId; // Menyimpan ID di objek socket
      client.join(userId); // Menetapkan client ke room berdasarkan userId

      console.log(`User ${userId} (${client.id}) terhubung.`);
      
    } catch (error) {
      console.error('WebSocket Auth Failed:', error.message);
      client.emit('error', 'Autentikasi gagal. Silakan login ulang.');
      client.disconnect(); // Tolak koneksi
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    console.log(`User ${userId} terputus.`);
  }

  // Method untuk mengirim notifikasi
  sendNotificationToUser(targetUserId: string, data: any) {
    this.server.to(targetUserId).emit('notification_new', data);
  }
}