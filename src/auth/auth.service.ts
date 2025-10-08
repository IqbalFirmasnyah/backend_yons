// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from 'src/dto/login.dto';
import { CreateUserDto } from '../dto/create_user.dto'; // Sesuaikan path DTO
import { UpdateUserDto } from '../dto/update_user.dto'; // Sesuaikan path DTO
import { ChangePasswordDto } from 'src/dto/change_password.dto';
import { Role } from './enums/role.enum';
import { JwtPayload } from './types/jwt-payload';
import { MailService } from 'src/services/mail.service';
import { ResetPasswordDto } from 'src/dto/reset_password.dto';
import { ForgotPasswordDto } from 'src/dto/forgot_password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const payload: JwtPayload = {
          sub: user.userId,
          username: user.username,
          role: Role.User,
          namaLengkap: user.namaLengkap,
        };
        return {
          accessToken: this.jwtService.sign(payload),
        };
      }
    }
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (admin) {
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (isPasswordValid) {
        const payload: JwtPayload = {
          sub: admin.adminId,
          username: admin.username,
          role: admin.role === 'superadmin' ? Role.SuperAdmin : Role.Admin,
          adminRole: admin.role as any,
          namaLengkap: admin.namaLengkap,
        };
        return {
          accessToken: this.jwtService.sign(payload),
        };
      }
    }
    throw new UnauthorizedException('Email atau Password Salah !!!');
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar.');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    try {
      const newUser = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
        select: {
          userId: true,
          username: true,
          email: true,
          namaLengkap: true,
          createdAt: true,
        },
      });
      await this.mailService
        .sendWelcomeEmail(newUser.email, newUser.namaLengkap)
        .catch(() => {});
      return newUser;
    } catch (error) {
      console.error('Error registering user:', error);
      throw new BadRequestException('Gagal melakukan pendaftaran.');
    }
  }

  async getUserProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        username: true,
        email: true,
        namaLengkap: true,
        alamat: true,
        tanggalLahir: true,
        noHp: true,
        fotoProfil: true,
        statusAktif: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Profil pengguna tidak ditemukan.');
    }
    return user;
  }

  async updateUserProfile(userId: number, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { userId },
        data: updateUserDto,
        select: {
          userId: true,
          username: true,
          email: true,
          namaLengkap: true,
          alamat: true,
          tanggalLahir: true,
          noHp: true,
          fotoProfil: true,
          statusAktif: true,
          updatedAt: true,
        },
      });
      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new BadRequestException('Gagal memperbarui profil pengguna.');
    }
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const isOldPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Kata sandi lama tidak cocok.');
    }

    const newHashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    try {
      await this.prisma.user.update({
        where: { userId },
        data: { password: newHashedPassword },
      });
      return { message: 'Kata sandi berhasil diubah.' };
    } catch (error) {
      console.error('Error changing password:', error);
      throw new BadRequestException('Gagal mengubah kata sandi.');
    }
  }

  async refreshToken(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { userId: true, username: true, namaLengkap: true },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Pengguna tidak ditemukan untuk refresh token.',
      );
    }

    const payload: JwtPayload = {
      sub: user.userId,
      username: user.username,
      role: Role.User, // Asumsi refresh token hanya untuk user biasa
      namaLengkap: user.namaLengkap,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const { email } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { userId: true, email: true, namaLengkap: true },
    });
    if (!user) {
      return { message: 'Jika email terdaftar, kode reset telah dikirim.' };
    }
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentCount = await this.prisma.passwordReset.count({
      where: { userId: user.userId, createdAt: { gte: fifteenMinAgo } },
    });
    if (recentCount >= 3) {
      throw new ForbiddenException(
        'Terlalu banyak permintaan. Coba lagi nanti.',
      );
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.passwordReset.create({
      data: {
        userId: user.userId,
        codeHash: otpHash,
        expiresAt,
      },
    });
    await this.mailService
      .sendPasswordResetEmail(user.email, user.namaLengkap, otp)
      .catch(() => {});
    return { message: 'Kode reset telah dikirim ke email Anda.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, code, newPassword } = dto;
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { userId: true, password: true },
    });
    if (!user) {
      throw new NotFoundException('Email tidak ditemukan.');
    }
    const reset = await this.prisma.passwordReset.findFirst({
      where: {
        userId: user.userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!reset) {
      throw new UnauthorizedException(
        'Kode reset tidak valid atau telah kadaluarsa.',
      );
    }
    const match = await bcrypt.compare(code, reset.codeHash);
    if (!match) {
      throw new UnauthorizedException('Kode verifikasi tidak cocok.');
    }
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({  where: { userId: user.userId },   data: { password: newHashedPassword },
      }),
      this.prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() },
      }),
      this.prisma.passwordReset.updateMany({
        where: { userId: user.userId, usedAt: null, id: { not: reset.id } },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: 'Password berhasil direset. Silakan login.' };
  }
}
