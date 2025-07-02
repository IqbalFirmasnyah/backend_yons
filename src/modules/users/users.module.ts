import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { User } from 'src/database/entities/user.entity';
import { UserService } from 'src/services/user.service';
import { UserController } from 'src/controllers/user.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}

