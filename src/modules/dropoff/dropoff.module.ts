import { Module } from '@nestjs/common';
import { DropoffController } from 'src/controllers/dropoff.controller'; 
import { DropoffService } from 'src/services/dropoff.service'; 
import { PrismaService } from 'src/prisma/prisma.service'; 
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { OsmModule } from '../osm/osm.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        OsmModule,
      ],
  controllers: [DropoffController],
  providers: [DropoffService, PrismaService],
  exports: [DropoffService], // Export if needed by other modules
})
export class DropoffModule {}