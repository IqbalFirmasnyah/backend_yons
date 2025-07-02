import { Injectable, UnauthorizedException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../dto/create_user.dto';
import { UpdateUserDto } from '../dto/update_user.dto';
import * as bcrypt from 'bcrypt';

export interface LoginDto {
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface JwtPayload {
  sub: number; 
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Cari user berdasarkan email
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        userId: true,
        username: true,
        email: true,
        password: true,
        namaLengkap: true,
        statusAktif: true,
        fotoProfil: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // User tidak ditemukan
    if (!user) {
      throw new UnauthorizedException('Email atau password tidak valid');
    }

    // Periksa apakah user masih aktif
    if (!user.statusAktif) {
      throw new ForbiddenException('Akun Anda telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut');
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password tidak valid');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.userId,
      username: user.username,
      email: user.email
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h' // Token berlaku 24 jam
    });

    // Return user data tanpa password dan dengan token
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      message: 'Login berhasil',
      user: userWithoutPassword,
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: '24h'
    };
  }

  async register(createUserDto: CreateUserDto) {
    // Sesuaikan field name dengan DTO (menggunakan snake_case)
    const userData = {
      username: createUserDto.username,
      email: createUserDto.email,
      password: createUserDto.password,
      namaLengkap: createUserDto.namaLengkap, // DTO menggunakan nama_lengkap
      alamat: createUserDto.alamat,
      tanggalLahir: createUserDto.tanggalLahir, // DTO menggunakan tanggal_lahir
      noHp: createUserDto.noHp, // DTO menggunakan no_hp
      fotoProfil: createUserDto.fotoProfil // DTO menggunakan foto_profil
    };

    // Cek apakah email sudah terdaftar
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUserByEmail) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Cek apakah username sudah terdaftar
    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username: userData.username }
    });

    if (existingUserByUsername) {
      throw new ConflictException('Username sudah terdaftar');
    }

    // Validasi password strength (opsional)
    if (userData.password.length < 6) {
      throw new BadRequestException('Password minimal 6 karakter');
    }

    try {
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Buat user baru
      const newUser = await this.prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          namaLengkap: userData.namaLengkap,
          alamat: userData.alamat,
          tanggalLahir: userData.tanggalLahir,
          noHp: userData.noHp,
          fotoProfil: userData.fotoProfil,
          statusAktif: true
        },
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
          createdAt: true
        }
      });

      // Generate JWT token untuk user baru
      const payload: JwtPayload = {
        sub: newUser.userId,
        username: newUser.username,
        email: newUser.email
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '24h'
      });

      return {
        message: 'Registrasi berhasil',
        user: newUser,
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: '24h'
      };

    } catch (error) {
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new ConflictException(`${field} sudah terdaftar`);
      }
      throw error;
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
        updatedAt: true
      }
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    if (!user.statusAktif) {
      throw new ForbiddenException('Akun tidak aktif');
    }

    return {
      message: 'Data user berhasil diambil',
      user
    };
  }

  async updateUserProfile(userId: number, updateUserDto: UpdateUserDto) {
    // Cek apakah user ada dan aktif
    const existingUser = await this.prisma.user.findUnique({
      where: { userId },
      select: { userId: true, statusAktif: true, email: true, username: true }
    });

    if (!existingUser) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    if (!existingUser.statusAktif) {
      throw new ForbiddenException('Akun tidak aktif');
    }

    // Jika email diubah, cek duplikasi
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email }
      });
      if (emailExists) {
        throw new ConflictException('Email sudah terdaftar');
      }
    }

    // Jika username diubah, cek duplikasi
    if (updateUserDto.username && updateUserDto.username !== existingUser.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: updateUserDto.username }
      });
      if (usernameExists) {
        throw new ConflictException('Username sudah terdaftar');
      }
    }

    try {
      // Prepare update data, mapping DTO fields to database fields
      const updateData: any = {};
      
      if (updateUserDto.username) updateData.username = updateUserDto.username;
      if (updateUserDto.email) updateData.email = updateUserDto.email;
      if (updateUserDto.namaLengkap) updateData.namaLengkap = updateUserDto.namaLengkap;
      if (updateUserDto.alamat) updateData.alamat = updateUserDto.alamat;
      if (updateUserDto.tanggalLahir) updateData.tanggalLahir = updateUserDto.tanggalLahir;
      if (updateUserDto.noHp) updateData.noHp = updateUserDto.noHp;
      if (updateUserDto.fotoProfil !== undefined) updateData.fotoProfil = updateUserDto.fotoProfil;
      
      // Hash password jika diubah
      if (updateUserDto.password) {
        const saltRounds = 12;
        updateData.password = await bcrypt.hash(updateUserDto.password, saltRounds);
      }

      const updatedUser = await this.prisma.user.update({
        where: { userId },
        data: updateData,
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
          updatedAt: true
        }
      });

      return {
        message: 'Profil berhasil diperbarui',
        user: updatedUser
      };

    } catch (error) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new ConflictException(`${field} sudah terdaftar`);
      }
      throw error;
    }
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        password: true,
        statusAktif: true
      }
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    if (!user.statusAktif) {
      throw new ForbiddenException('Akun tidak aktif');
    }

    // Verifikasi password lama
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Password lama tidak valid');
    }

    // Validasi password baru
    if (newPassword.length < 6) {
      throw new BadRequestException('Password baru minimal 6 karakter');
    }

    if (oldPassword === newPassword) {
      throw new BadRequestException('Password baru harus berbeda dengan password lama');
    }

    // Hash password baru
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    return {
      message: 'Password berhasil diubah'
    };
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { userId: payload.sub },
      select: {
        userId: true,
        username: true,
        email: true,
        namaLengkap: true,
        statusAktif: true
      }
    });

    if (!user || !user.statusAktif) {
      throw new UnauthorizedException('Invalid user');
    }

    return user;
  }

  async refreshToken(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        username: true,
        email: true,
        statusAktif: true
      }
    });

    if (!user || !user.statusAktif) {
      throw new UnauthorizedException('User tidak valid');
    }

    const payload: JwtPayload = {
      sub: user.userId,
      username: user.username,
      email: user.email
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h'
    });

    return {
      message: 'Token berhasil diperbarui',
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: '24h'
    };
  }
}