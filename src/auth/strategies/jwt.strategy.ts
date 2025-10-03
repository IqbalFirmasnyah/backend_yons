// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload'; 
import { Role } from '../enums/role.enum'; 
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    // --- FIX STARTS HERE ---

    // 1. Get the JWT_SECRET before calling super().
    // You can safely access configService directly here because it's a constructor parameter,
    // not a 'this' property being accessed prematurely.
    const jwtSecret = configService.get<string>('JWT_SECRET');

    // 2. Validate the secret.
    if (!jwtSecret) {
      // It's crucial to throw an error if the secret is missing, as the application cannot function without it.
      throw new Error('JWT_SECRET is not configured. Please set it in your environment variables.');
    }

    // 3. Call super() as the first statement, passing the validated secret.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // Now 'jwtSecret' is guaranteed to be a string
    });

    // --- FIX ENDS HERE ---
  }

  async validate(payload: JwtPayload) {
    if (!payload.role || !payload.sub) {
      throw new UnauthorizedException('Token tidak valid: Informasi peran atau ID tidak ditemukan.');
    }

    let entity: any;

    try {
      if (payload.role === Role.User) {
        entity = await this.prisma.user.findUnique({
          where: { userId: payload.sub },
          select: { userId: true, username: true, email: true, namaLengkap: true, noHp: true, fotoProfil: true, statusAktif: true }
        });
        if (!entity) {
          throw new UnauthorizedException('Pengguna tidak ditemukan.');
        }
      } else if (payload.role === Role.Admin || payload.role === Role.SuperAdmin) {
        entity = await this.prisma.admin.findUnique({
          where: { adminId: payload.sub },
          select: { adminId: true, username: true, email: true, namaLengkap: true, fotoProfil: true, role: true, statusAktif: true }
        });
        if (!entity) {
          throw new UnauthorizedException('Admin tidak ditemukan.');
        }
      } else {
        throw new UnauthorizedException('Token tidak valid: Peran tidak dikenali.');
      }

      return {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
        roles: [payload.role],
        namaLengkap: payload.namaLengkap,
        isUser: payload.role === Role.User,
        isAdmin: payload.role === Role.Admin || payload.role === Role.SuperAdmin,
        isSuperAdmin: payload.role === Role.SuperAdmin,
        adminRole: (payload.role === Role.Admin || payload.role === Role.SuperAdmin) ? entity.role : undefined,
        email: entity.email,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error during JWT validation:', error);
      throw new UnauthorizedException('Validasi token gagal.');
    }
  }
}