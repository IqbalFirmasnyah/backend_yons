// src/auth/admin-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum'; // Sesuaikan path
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class AdminAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Panggil canActivate dari AuthGuard ('jwt') terlebih dahulu
    // Ini akan menjalankan `JwtStrategy.validate` dan menempatkan `user` di `request.user`
    const baseAuthGuardResult = await super.canActivate(context);

    if (!baseAuthGuardResult) {
      // Jika autentikasi JWT gagal, biarkan AuthGuard yang melempar UnauthorizedException
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Ini adalah objek yang dikembalikan dari JwtStrategy.validate

    // Dapatkan peran yang disyaratkan dari metadata (misal dari @Roles(Role.Admin, Role.SuperAdmin))
    const requiredRoles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler());

    // Jika tidak ada peran yang disyaratkan pada handler, biarkan akses
    if (!requiredRoles) {
      return true;
    }

    // Pastikan objek user ada dan memiliki properti role
    if (!user || !user.role) {
      throw new ForbiddenException('Akses ditolak: Informasi peran pengguna tidak tersedia.');
    }

    // Periksa apakah peran pengguna (dari token) memenuhi salah satu peran yang disyaratkan
    // Contoh: Jika diperlukan Role.Admin, maka Role.Admin atau Role.SuperAdmin bisa lewat.
    // Jika diperlukan Role.SuperAdmin, hanya Role.SuperAdmin yang bisa lewat.
    const hasRequiredRole = requiredRoles.some(requiredRole => {
      if (requiredRole === Role.Admin && (user.role === Role.Admin || user.role === Role.SuperAdmin)) {
        return true;
      }
      if (requiredRole === Role.SuperAdmin && user.role === Role.SuperAdmin) {
        return true;
      }
      // Tambahkan logika untuk Role.User jika diperlukan di guard ini (misal, rute untuk semua user)
      if (requiredRole === Role.User && user.role === Role.User) {
        return true;
      }
      return false;
    });

    if (!hasRequiredRole) {
      throw new ForbiddenException('Akses ditolak: Anda tidak memiliki hak yang diperlukan.');
    }

    return true; // Jika semua cek lolos
  }
}