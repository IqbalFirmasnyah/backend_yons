import { Module } from '@nestjs/common';
import { ReportController } from 'src/controllers/report.controller';
import { ReportService } from 'src/services/report.service'; 
import { PdfService } from 'src/services/pdf.service'; 
import { BookingService } from 'src/services/booking.service'; 
import { PrismaService } from 'src/prisma/prisma.service';
import { PushNotificationService } from 'src/services/notification/push-notification.service'; 
import { NotificationGateway } from 'src/notification/notification.gateway';
import { BookingModule } from '../booking/booking.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule,
        BookingModule],  
  controllers: [ReportController],
  providers: [
    ReportService,
    PdfService,
  ],
})
export class ReportModule {}
