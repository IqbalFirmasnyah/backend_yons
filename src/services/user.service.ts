import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { CreateUserDto } from '../dto/create_user.dto';
import { UpdateUserDto } from '../dto/update_user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if the username or email already exists
    const existingUser  = await this.userRepository.findOne({
      where: [{ username: createUserDto.username }, { email: createUserDto.email }]
    });

    if (existingUser ) {
      throw new ConflictException('Username or email already exists');
    }

    const user = new User();
    Object.assign(user, createUserDto);
    
    // Hash password
    user.password = await bcrypt.hash(createUserDto.password, 10);
    
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      where: { statusAktif: true } // Use camelCase for property names
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId: id, statusAktif: true }, // Use camelCase for property names
      relations: ['pesanan', 'booking', 'pembayaran']
    });
    
    if (!user) {
      throw new NotFoundException(`User  with ID ${id} not found`);
    }
    
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username, statusAktif: true } // Use camelCase for property names
    });
  }

  async findByUsernameOrFail(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username, statusAktif: true } // Use camelCase for property names
    });
    
    if (!user) {
      throw new NotFoundException(`User  with username ${username} not found`);
    }
    
    return user;
  }

  async update(id: number, updateData: UpdateUserDto): Promise<User> {
    // Check if user exists first
    const user = await this.findOne(id); // This will throw NotFoundException if not found
    
    // Update the user
    await this.userRepository.update(id, updateData);
    
    // Return updated user
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    // Check if user exists first
    await this.findOne(id); // This will throw NotFoundException if not found
    
    // Soft delete by setting statusAktif to false
    await this.userRepository.update(id, { statusAktif: false });
  }

  async validateUser (username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    
    return null;
  }
}
