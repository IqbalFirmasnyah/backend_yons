// src/auth/auth.controller.ts
import {
    Controller,
    Post,
    Body,
    Get,
    Put,
    UseGuards,
    HttpStatus,
    ValidationPipe,
    Req, // Gunakan @Req dari NestJS, bukan express
    HttpCode,
    ForbiddenException // Tambahkan ini untuk error yang tepat
  } from '@nestjs/common';
  import { AuthService } from './auth.service';
  import { CreateUserDto } from '../dto/create_user.dto';
  import { UpdateUserDto } from '../dto/update_user.dto';
  import { JwtAuthGuard } from './strategies/jwt_auth.guard'; // Pastikan path benar, ini adalah guard bawaan dari Passport
  import { Public } from '../public/public.decorator'; // Untuk public decorator
  import { GetUser } from '../public/get_user.decorator'; // Untuk custom decorator @GetUser
  import { AdminAuthGuard } from './strategies/admin_auth.guard'; 
  import { Roles } from './decorators/roles.decorator'; 
  import { Role } from './enums/role.enum';
  import { LoginDto } from 'src/dto/login.dto';
  import { ChangePasswordDto } from 'src/dto/change_password.dto';
  
  @Controller('auth')
  // Secara default, semua rute di controller ini akan dilindungi kecuali ditandai @Public()
  // UseGuards(JwtAuthGuard) bisa diterapkan di sini atau per method.
  // Untuk controller Auth, seringkali hanya rute login/register yang public, sisanya protected
  @UseGuards(JwtAuthGuard)
  export class AuthController {
    constructor(private authService: AuthService) {}
  
    @Public() // Endpoint ini bisa diakses tanpa token
    @Post('login')
    @HttpCode(HttpStatus.OK) // Pastikan mengembalikan 200 OK
    async login(@Body(ValidationPipe) loginDto: LoginDto) { // Gunakan ValidationPipe
      // Logika login ada di AuthService, yang akan menentukan apakah user atau admin
      return this.authService.login(loginDto);
    }
  
    @Public() // Endpoint ini bisa diakses tanpa token
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body(ValidationPipe) createUserDto: CreateUserDto) {
      return this.authService.register(createUserDto);
    }
  
  
    @Get('profile')
    async getProfile(@GetUser() user: any) { 
      
      if (user.role === Role.User) {
        return this.authService.getUserProfile(user.id);
      } else if (user.role === Role.Admin || user.role === Role.SuperAdmin) {
        return { message: 'Admin profile data (example)', data: user };
      }
      throw new ForbiddenException('Akses profil tidak diizinkan untuk peran ini.');
    }
  
    @Put('profile')
    async updateProfile(
      @GetUser() user: any, 
      @Body(ValidationPipe) updateUserDto: UpdateUserDto
    ) {
      if (user.role !== Role.User) {
        throw new ForbiddenException('Hanya pengguna biasa yang dapat memperbarui profil ini.');
      }
      return this.authService.updateUserProfile(user.id, updateUserDto);
    }
  
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    async changePassword(
      @GetUser() user: any,
      @Body(ValidationPipe) changePasswordDto: ChangePasswordDto
    ) {
      // Metode changePassword di AuthService Anda saat ini hanya untuk User.
      // Jika admin juga bisa ganti password, Anda perlu menambahkan logika di AuthService
      // untuk membedakan antara userId dan adminId.
      if (user.role === Role.User) {
          return this.authService.changePassword(user.id, changePasswordDto);
      }
      throw new ForbiddenException('Perubahan kata sandi tidak diizinkan untuk peran ini.');
    }
  
    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@GetUser() user: any) {
      // Sama seperti changePassword, metode refreshToken di AuthService saat ini untuk User.
      if (user.role === Role.User) {
          return this.authService.refreshToken(user.id);
      }
      throw new ForbiddenException('Refresh token tidak diizinkan untuk peran ini.');
    }
  
    @Get('me')
    async getCurrentUser(@GetUser() user: any) {
      
      return {
        message: 'Data pengguna berhasil diambil',
        user: user 
      };
    }
  
    
  
    @Get('admin/dashboard')
    @UseGuards(AdminAuthGuard) // Gunakan AdminAuthGuard untuk melindungi rute ini
    @Roles(Role.Admin, Role.SuperAdmin) // Hanya admin atau superadmin yang bisa mengakses
    async getAdminDashboard(@Req() req) {
      // req.user akan berisi { id: adminId, username, role: 'admin'/'superadmin', ... }
      return {
        message: `Selamat datang di dashboard admin, ${req.user.namaLengkap}!`,
        user: req.user,
      };
    }
  
    @Get('admin/users-data')
    @UseGuards(AdminAuthGuard) // Wajib gunakan guard lagi di sini jika tidak diterapkan di Controller level
    @Roles(Role.SuperAdmin) // Hanya superadmin yang bisa mengakses ini
    async getAllUsersForSuperAdmin(@Req() req) {
      // Hanya superadmin yang bisa melihat ini
      return {
        message: 'Ini adalah data sensitif semua pengguna.',
        user: req.user,
        data: await this.authService['prisma'].user.findMany({ select: { userId: true, username: true, email: true, namaLengkap: true } }), // Contoh: Ambil semua user dari prisma
      };
    }
  }