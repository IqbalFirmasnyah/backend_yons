import { Module } from '@nestjs/common';
import { DetailRuteController } from 'src/controllers/detail_rute.controller'; 
import { DetailRuteService } from 'src/services/detail_rute.service'; 
import { PrismaModule } from 'src/prisma/prisma.module'; 
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule
      ],
  controllers: [DetailRuteController],
  providers: [DetailRuteService],
  exports: [DetailRuteService],
})
export class DetailRuteModule {}