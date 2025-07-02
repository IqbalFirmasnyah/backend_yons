import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { Refund } from 'src/database/entities/refund.entity';
import { RefundService } from 'src/services/refund.service';
import { RefundController } from 'src/controllers/refund.controller';


@Module({
    imports: [PrismaModule],
    controllers: [RefundController],
    providers: [RefundService],
    exports: [RefundService]
  })
export class RefundModule {}


