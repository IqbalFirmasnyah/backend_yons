import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RefundService } from 'src/services/refund.service';
import { BookingService } from 'src/services/booking.service';
import { CreateRefundDto, RefundStatus } from 'src/dto/create_refund.dto';
import { UpdateRefundDto } from 'src/dto/update_refund.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;    
    role: 'user' | 'admin';
  };

}

@ApiTags('Refunds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('refunds')
export class RefundController {

  constructor(private readonly refundService: RefundService,
    private readonly bookingService: BookingService) {}

  
  @Get('check-booking/:bookingId')
  @Roles(Role.User)
  @ApiOperation({ summary: 'Check booking eligibility for refund' })
  async checkBookingEligibility(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      await this.bookingService.checkRefundEligibility(bookingId);
      return{
        eligible: true,
        message: 'Booking eligible untuk refund berdasarkan batasan waktu H-3.'
      } 
      
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;

      console.error('Error checking booking eligibility:', error);
      throw new InternalServerErrorException(
        'Failed to check booking eligibility',
      );
    }
  }

  // ----------------- CREATE REFUND -----------------
  @Post('booking/:bookingId')
  @Roles(Role.User)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new refund request for a booking' })
  async createRefund(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body() createRefundDto: CreateRefundDto,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      const refund = await this.refundService.createRefund(
        req.user.id,
        bookingId,
        createRefundDto,
      );

      return {
        success: true,
        message: 'Refund request created successfully',
        data: refund,
      };
    } catch (error) {
      console.error('Error creating refund:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;

      throw new InternalServerErrorException('Failed to create refund request');
    }
  }

  // ----------------- GET MY REFUNDS -----------------
  @Get('my-refunds')
  @Roles(Role.User)
  @ApiOperation({ summary: 'Get current user refund requests' })
  async getMyRefunds(@Req() req: AuthenticatedRequest) {
    try {
      const refunds = await this.refundService.getRefundsByUser(req.user.id);
      return {
        success: true,
        data: refunds,
        count: refunds.length,
      };
    } catch (error) {
      console.error('Error fetching user refunds:', error);
      throw new InternalServerErrorException('Failed to retrieve user refunds');
    }
  }

  @Get()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Retrieve all refund requests (Admin only)' })
  async findAll() {
    try {
      const refunds = await this.refundService.findAllRefunds();

      // Pastikan format data rapi dan menyertakan nama user
      const formatted = refunds.map((r) => ({
        refundId: r.refundId,
        bookingId: r.bookingId,
        userId: r.userId,
        userName: r.user?.namaLengkap ?? '-', 
        jumlahRefund: r.jumlahRefund,
        statusRefund: r.statusRefund,
        createdAt: r.createdAt,
      }));

      return {
        success: true,
        message: 'Refund list retrieved successfully',
        count: formatted.length,
        data: formatted,
      };
    } catch (error) {
      console.error('❌ Error fetching all refunds:', error);
      throw new InternalServerErrorException('Failed to retrieve refund list');
    }
  }
  // ----------------- GET SINGLE REFUND -----------------
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single refund request by ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      const refund = await this.refundService.findOneRefund(id);

      if (req.user.role !== 'admin' && refund.userId !== req.user.id) {
        throw new ForbiddenException('Access denied');
      }

      return {
        success: true,
        data: refund,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;

      console.error(`Error fetching refund with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to retrieve refund');
    }
  }

  // ----------------- UPDATE REFUND (ADMIN) -----------------
  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update an existing refund request (Admin only)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRefundDto: UpdateRefundDto,
  ) {
    try {
      const updatedRefund = await this.refundService.updateRefund(
        id,
        updateRefundDto,
      );

      return {
        success: true,
        message: 'Refund updated successfully',
        data: updatedRefund,
      };
    } catch (error) {
      console.error(`Error updating refund with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to update refund');
    }
  }

  // ----------------- APPROVE REFUND (ADMIN) -----------------
  @Patch(':id/approve')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Approve a refund request (Admin only)' })
  async approveRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { catatanAdmin?: string; jumlahPotonganAdmin?: number },
  ) {
    try {
      const updateDto: UpdateRefundDto = {
        statusRefund: RefundStatus.APPROVED,
        catatanAdmin: body.catatanAdmin,
        jumlahPotonganAdmin: body.jumlahPotonganAdmin,
      };

      const updatedRefund = await this.refundService.updateRefund(id, updateDto);

      return {
        success: true,
        message: 'Refund approved successfully',
        data: updatedRefund,
      };
    } catch (error) {
      console.error(`Error approving refund with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to approve refund');
    }
  }

  // ----------------- REJECT REFUND (ADMIN) -----------------
  @Patch(':id/reject')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Reject a refund request (Admin only)' })
  async rejectRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { catatanAdmin: string },
  ) {
    try {
      const updateDto: UpdateRefundDto = {
        statusRefund: RefundStatus.REJECTED,
        catatanAdmin: body.catatanAdmin,
      };

      const updatedRefund = await this.refundService.updateRefund(id, updateDto);

      return {
        success: true,
        message: 'Refund rejected successfully',
        data: updatedRefund,
      };
    } catch (error) {
      console.error(`Error rejecting refund with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to reject refund');
    }
  }

  // ----------------- DELETE REFUND -----------------
  @Delete(':id')
  @Roles(Role.User, Role.Admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a refund request by ID' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      const deleted = await this.refundService.removeRefund(id, req.user);
      return {
        success: true,
        message: 'Refund deleted successfully',
        data: deleted,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;

      console.error(`Error deleting refund with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete refund');
    }
  }
}
