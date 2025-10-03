// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Pastikan Anda mengimpor PrismaModule
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Impor ConfigModule dan ConfigService

@Module({
  imports: [
    PrismaModule, // Pastikan PrismaModule tersedia
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // Impor ConfigModule di sini
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' }, // Contoh durasi token
      }),
      inject: [ConfigService], // Injeksi ConfigService
    }),
    ConfigModule, // Pastikan ConfigModule terdaftar di imports
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Jika Anda memiliki JwtAuthGuard yang Anda buat sendiri, pastikan juga di sini.
    // Jika Anda menggunakan `import { JwtAuthGuard } from '@nestjs/passport/guards/jwt';`
    // atau `import { JwtAuthGuard } from './strategies/jwt_auth.guard';`
    // dan itu hanya wrapper sederhana, mungkin tidak perlu di `providers` di sini.
    // AdminAuthGuard juga tidak perlu di providers karena dia adalah guard yang digunakan via `@UseGuards()`.
  ],
  exports: [AuthService, JwtModule,PassportModule, JwtModule], // Ekspor AuthService dan JwtModule jika modul lain membutuhkannya
})
export class AuthModule {}