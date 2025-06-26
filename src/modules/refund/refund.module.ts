import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Refund } from 'src/database/entities/refund.entity';
import { RefundService } from 'src/services/refund.service';
import { RefundController } from 'src/controllers/refund.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Refund]),
  ],
  providers: [RefundService],
  controllers: [RefundController],
  exports: [RefundService], // Ekspor RefundService jika diperlukan di modul lain
})
export class RefundModule {}
