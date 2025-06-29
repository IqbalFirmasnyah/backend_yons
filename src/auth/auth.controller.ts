import { 
    Controller, 
    Post, 
    Body, 
    Get, 
    Put, 
    UseGuards, 
    HttpCode, 
    HttpStatus,
    ValidationPipe
  } from '@nestjs/common';
  import { AuthService } from './auth.service';
  import { CreateUserDto } from '../dto/create_user.dto';
  import { UpdateUserDto } from '../dto/update_user.dto';
  import { JwtAuthGuard } from '../auth/strategies/jwt_auth.guard';
  import { Public } from '../public/public.decorator';
  import { GetUser } from '../public/get_user.decorator';
  
  export class LoginDto {
    email: string;
    password: string;
  }
  
  export class ChangePasswordDto {
    oldPassword: string;
    newPassword: string;
  }
  
  @Controller('auth')
  @UseGuards(JwtAuthGuard)
  export class AuthController {
    constructor(private authService: AuthService) {}
  
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body(ValidationPipe) loginDto: LoginDto) {
      return this.authService.login(loginDto);
    }
  
    @Public()
    @Post('register')
    async register(@Body(ValidationPipe) createUserDto: CreateUserDto) {
      return this.authService.register(createUserDto);
    }
  
    @Get('profile')
    async getProfile(@GetUser('userId') userId: number) {
      return this.authService.getUserProfile(userId);
    }
  
    @Put('profile')
    async updateProfile(
      @GetUser('userId') userId: number,
      @Body(ValidationPipe) updateUserDto: UpdateUserDto
    ) {
      return this.authService.updateUserProfile(userId, updateUserDto);
    }
  
    @Post('change-password')
    async changePassword(
      @GetUser('userId') userId: number,
      @Body(ValidationPipe) changePasswordDto: ChangePasswordDto
    ) {
      return this.authService.changePassword(userId, changePasswordDto);
    }
  
    @Post('refresh-token')
    async refreshToken(@GetUser('userId') userId: number) {
      return this.authService.refreshToken(userId);
    }
  
    @Get('me')
    async getCurrentUser(@GetUser() user: any) {
      return {
        message: 'User data retrieved successfully',
        user
      };
    }
  }