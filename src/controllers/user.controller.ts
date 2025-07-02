import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UsePipes,
    ValidationPipe,
    ParseIntPipe,
  } from '@nestjs/common';
  import { UserService } from 'src/services/user.service'; 
  import { CreateUserDto } from '../dto/create_user.dto';
  import { UpdateUserDto } from '../dto/update_user.dto';
  
  @Controller('users')
  export class UserController {
    constructor(private readonly userService: UserService) {}
  
    // ➕ CREATE
    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true }))
    create(@Body() createUserDto: CreateUserDto) {
      return this.userService.create(createUserDto);
    }
  
    // 📄 GET ALL USERS
    @Get()
    findAll() {
      return this.userService.findAll();
    }
  
    // 🔍 GET ONE BY ID
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.userService.findOne(id);
    }
  
    // ✏️ UPDATE USER
    @Patch(':id')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateUserDto: UpdateUserDto,
    ) {
      return this.userService.update(id, updateUserDto);
    }
  
    // 🗑️ DELETE / SOFT DELETE USER
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.userService.remove(id);
    }
  }
  