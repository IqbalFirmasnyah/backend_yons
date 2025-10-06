// src/controllers/report.controller.ts
import {
    Controller,
    Get,
    Query,
    Res,
    HttpStatus,
    BadRequestException,
  } from '@nestjs/common';
  import { ReportService } from 'src/services/report.service';
  import { PdfService } from 'src/services/pdf.service';
  import { Response } from 'express';
  
  function parseDate(s?: string): Date | undefined {
    if (!s) return undefined;
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  }
  
  @Controller('reports')
  export class ReportController {
    constructor(
      private readonly reportService: ReportService,
      private readonly pdfService: PdfService,
    ) {}
  
    // JSON
    @Get('bookings')
    async bookingsJson(
      @Query('from') from?: string,
      @Query('to') to?: string,
      @Query('status') status?: string,
    ) {
      const period = { from: parseDate(from), to: parseDate(to) };
      const data = await this.reportService.generateBookingsReport(period);
      return {
        statusCode: HttpStatus.OK,
        message: 'Laporan booking (JSON)',
        period,
        data,
      };
    }
  
    
    @Get('bookings.pdf')
    async bookingsPdf(
      @Res() res: Response,
      @Query('from') from?: string,
      @Query('to') to?: string,
      @Query('status') status?: string,
    ) {
      const period = { from: parseDate(from), to: parseDate(to) };
  
      const report = await this.reportService.generateBookingsReport(period);
      const html = this.reportService.renderBookingsHtml(report);
  
      // Render jadi PDF
      const pdfBuffer = await this.pdfService.htmlToPdf(html);
      if (!pdfBuffer) {
        throw new BadRequestException('Gagal membuat PDF.');
      }
  
      const today = new Date().toISOString().slice(0, 10);
      const filename = `laporan-booking_${today}.pdf`;
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer); // <= penting
    }

    @Get('refunds')
    async refundsJson(
      @Query('from') from?: string,
      @Query('to') to?: string,
      @Query('status') status?: string,
    ) {
      const period = { from: parseDate(from), to: parseDate(to) };
      const data = await this.reportService.generateRefundsReport(period, { status });
      return {
        statusCode: HttpStatus.OK,
        message: 'Laporan refund (JSON)',
        period,
        filter: { status: status ?? null },
        data,
      };
    }
  
    /* =================== REFUNDS (PDF) ==================== */
    @Get('refunds.pdf')
    async refundsPdf(
      @Res() res: Response,
      @Query('from') from?: string,
      @Query('to') to?: string,
      @Query('status') status?: string,
    ) {
      const period = { from: parseDate(from), to: parseDate(to) };
      const report = await this.reportService.generateRefundsReport(period, { status });
      const html = this.reportService.renderRefundsHtml(report);
  
      const pdfBuffer = await this.pdfService.htmlToPdf(html);
      if (!pdfBuffer) throw new BadRequestException('Gagal membuat PDF');
  
      const today = new Date().toISOString().slice(0, 10);
      const filename = `laporan-refund_${today}.pdf`;
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    }
  }
  