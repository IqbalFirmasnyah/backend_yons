import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ParseIntPipe,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { RescheduleService } from 'src/services/reschedule.service';
import { CreateRescheduleDto } from 'src/dto/create-reschedule.dto';
import { UpdateRescheduleDto } from 'src/dto/update-reschedule.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
import { AdminAuthGuard } from 'src/auth/strategies/admin_auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Reschedule')
@ApiBearerAuth()
@Controller('reschedule')
export class RescheduleController {
  
  constructor(private readonly rescheduleService: RescheduleService,
    private readonly prisma: PrismaService,) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new reschedule request' })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reschedule request created successfully.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or booking not eligible for reschedule.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  async create(
    @Body(ValidationPipe) createRescheduleDto: CreateRescheduleDto,
    @Request() req,
  ) {
    const userId = req.user.id; // Corrected: Access 'id' property
    const reschedule = await this.rescheduleService.createRescheduleRequest(
      createRescheduleDto,
      userId,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Reschedule request created successfully',
      data: reschedule,
    };
  }

  @Post('validate/:bookingId')
  async validateReschedule(
    @Param('bookingId') id: number,
    @Body() body: { tanggalBaru: string },
  ) {
    const tanggalBaru = new Date(body.tanggalBaru);
    const tanggalPengajuan = new Date();

    const booking = await this.prisma.booking.findUnique({ // Gunakan PrismaService
        where: { bookingId: id },
    });
  
    if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found.`);
    }
    await this.rescheduleService.validateRescheduleEligibility(
      booking,
      tanggalBaru,
      tanggalPengajuan,
    );

    return { eligible: true, message: 'Reschedule diizinkan' };
  }

  @UseGuards(AdminAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update the status of a reschedule request (Admin)',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Reschedule request status updated successfully.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Reschedule request not found.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status or request is not pending.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden resource.',
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateRescheduleDto: UpdateRescheduleDto,
    @Request() req,
  ) {
    const adminId = req.user.id; // Corrected: Access 'id' property
    const updatedReschedule =
      await this.rescheduleService.updateRescheduleStatus(
        id,
        updateRescheduleDto,
        adminId,
      );
    return {
      statusCode: HttpStatus.OK,
      message: 'Reschedule request status updated successfully',
      data: updatedReschedule,
    };
  }
  

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single reschedule request by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Reschedule request retrieved successfully.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Reschedule request not found.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const reschedule = await this.rescheduleService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Reschedule request retrieved successfully',
      data: reschedule,
    };
  }

  @UseGuards(AdminAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Retrieve all pending reschedule requests (Admin)' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'All pending reschedule requests retrieved successfully.',
  })
  @SwaggerApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden resource.',
  })
  async findAllPending() {
    const reschedules = await this.rescheduleService.findAllPending();
    return {
      statusCode: HttpStatus.OK,
      message: 'Pending reschedules retrieved successfully',
      data: reschedules,
    };
  }

  
@UseGuards(JwtAuthGuard)
@Get('my')
@ApiOperation({ summary: 'Get my reschedule requests (by user)' })
@SwaggerApiResponse({ status: HttpStatus.OK, description: 'My reschedules retrieved successfully.' })
async findMy(@Request() req) {
  const userId = req.user.id;
  const items = await this.rescheduleService.findMineByUserId(userId);
  return {
    statusCode: HttpStatus.OK,
    message: 'My reschedules retrieved successfully',
    data: items,
  };
}

@UseGuards(JwtAuthGuard)
@Get('by-booking/:bookingId')
async byBooking(
  @Param('bookingId', ParseIntPipe) bookingId: number,
  @Request() req,
) {
  const userId = req.user.id;
  const items = await this.rescheduleService.findByBooking(bookingId, userId);
  return { statusCode: 200, data: items };
}

}
