import {
    Injectable,
    NotFoundException,
    ConflictException,
  } from '@nestjs/common';
  import { PrismaService } from '../prisma/prisma.service';
  import { CreateUserDto } from '../dto/create_user.dto';
  import { UpdateUserDto } from '../dto/update_user.dto';
  import * as bcrypt from 'bcrypt';
  
  @Injectable()
  export class UserService {
    constructor(private prisma: PrismaService) {}
  
    async create(createUserDto: CreateUserDto) {
      const { username, email, password, ...rest } = createUserDto;
  
      // Cek apakah user dengan username/email sudah ada
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }],
        },
      });
  
      if (existingUser) {
        throw new ConflictException('Username or email already exists');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      return this.prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          ...rest,
        },
      });
    }
  
    async findAll() {
      return this.prisma.user.findMany({
        where: { statusAktif: true },
      });
    }
  
    async findOne(id: number) {
      const user = await this.prisma.user.findUnique({
        where: { userId: id },
        include: {
          pesanan: true,
          booking: true,
          pembayaran: true,
        },
      });
  
      if (!user || !user.statusAktif) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
  
      return user;
    }
  
    async findByUsername(username: string) {
      return this.prisma.user.findFirst({
        where: {
          username,
          statusAktif: true,
        },
      });
    }
  
    async findByUsernameOrFail(username: string) {
      const user = await this.findByUsername(username);
  
      if (!user) {
        throw new NotFoundException(`User with username ${username} not found`);
      }
  
      return user;
    }
  
    async update(id: number, updateUserDto: UpdateUserDto) {
      // Pastikan user ada dulu
      await this.findOne(id);
  
      return this.prisma.user.update({
        where: { userId: id },
        data: updateUserDto,
      });
    }
  
    async remove(id: number) {
      await this.findOne(id); // throws NotFoundException if not exists
  
      return this.prisma.user.update({
        where: { userId: id },
        data: { statusAktif: false },
      });
    }
  
    async validateUser(username: string, password: string) {
      const user = await this.findByUsername(username);
  
      if (!user) return null;
  
      const isMatch = await bcrypt.compare(password, user.password);
      return isMatch ? user : null;
    }
  }
  