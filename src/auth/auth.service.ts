// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from 'src/dto/login.dto'; 
import { CreateUserDto } from '../dto/create_user.dto'; // Sesuaikan path DTO
import { UpdateUserDto } from '../dto/update_user.dto'; // Sesuaikan path DTO
import { ChangePasswordDto } from 'src/dto/change_password.dto'; 
import { Role } from './enums/role.enum'; 
import { JwtPayload } from './types/jwt-payload'; 

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;

    // Coba autentikasi sebagai User
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        // Buat payload JWT untuk User
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

    // Jika bukan User yang valid atau password salah, coba autentikasi sebagai Admin
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (admin) {
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (isPasswordValid) {
        // Buat payload JWT untuk Admin
        const payload: JwtPayload = {
          sub: admin.adminId,
          username: admin.username,
          role: admin.role === 'superadmin' ? Role.SuperAdmin : Role.Admin, // Sesuaikan dengan enum Anda
          adminRole: admin.role as any, // Simpan role spesifik admin jika diperlukan
          namaLengkap: admin.namaLengkap,
        };
        return {
          accessToken: this.jwtService.sign(payload),
        };
      }
    }

    // Jika tidak ada yang cocok atau password salah
    throw new UnauthorizedException('Kredensial login tidak valid.');
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

    const newHashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

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
      throw new UnauthorizedException('Pengguna tidak ditemukan untuk refresh token.');
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

  // Metode validateUser() di JwtStrategy tidak perlu memanggil AuthService.validateUser
  // melainkan langsung mencari user/admin di database seperti yang sudah kita revisi.
  // Jadi, Anda bisa menghapus atau tidak menggunakan metode validateUser(payload) ini di AuthService.
  // Jika Anda tetap ingin ada, mungkin untuk tujuan internal AuthService saja.
  // Contoh:
  // async validateUserByPayload(payload: JwtPayload): Promise<any> {
  //   if (payload.role === Role.User) {
  //     return this.prisma.user.findUnique({ where: { userId: payload.sub } });
  //   } else if (payload.role === Role.Admin || payload.role === Role.SuperAdmin) {
  //     return this.prisma.admin.findUnique({ where: { adminId: payload.sub } });
  //   }
  //   return null;
  // }
}