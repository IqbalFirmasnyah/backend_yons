// src/types/jwt-payload.ts
import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: number; // Ini akan menjadi userId atau adminId
  username: string;
  role: Role; // Peran utama pengguna: 'user', 'admin', 'superadmin'
  namaLengkap: string;
  adminRole?: 'superadmin' | 'admin'; // Hanya ada jika role adalah 'admin' atau 'superadmin'
}