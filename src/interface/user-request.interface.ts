// src/types/user-request.interface.ts
import { Request } from 'express';

interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  // tambahkan properti lain yang ada di payload JWT Anda
}

export interface UserRequest extends Request {
  user: JwtPayload;
}