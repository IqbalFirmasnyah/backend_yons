import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { Role } from '../enums/role.enum';
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
        'roles',
        [context.getHandler(), context.getClass()],
      );
  
      if (!requiredRoles) {
        return true; // Tidak ada role dibutuhkan, akses diizinkan
      }
  
      const request = context.switchToHttp().getRequest();
      const user = request.user;
  
      if (!user || !user.roles) {
        throw new ForbiddenException('Akses ditolak. Role tidak ditemukan.');
      }
  
      const hasRole = requiredRoles.some(role => user.roles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException('Akses ditolak. Tidak memiliki izin.');
      }
  
      return true;
    }
  }