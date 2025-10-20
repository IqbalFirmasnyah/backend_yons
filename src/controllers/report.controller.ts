// src/controllers/report.controller.ts
import { Controller, Get, Query, Res, HttpStatus, BadRequestException } from '@nestjs/common';
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

  @Get('bookings')
  async getBookingsReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    const period = {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };
    const result = await this.reportService.generateBookingsReport(period, { status });
    return { data: result };
  }

  @Get('bookings.pdf')
  async getBookingsReportPdf(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    try {
      if (from === '') from = undefined;
      if (to === '') to = undefined;
      if (status === '') status = undefined;
      const period = {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      };
      const result = await this.reportService.generateBookingsReport(period, { status });
      const html = this.reportService.renderBookingsHtml(result, { status });
      const pdfBuffer = await this.pdfService.htmlToPdf(html);
      if (!pdfBuffer) throw new BadRequestException('Gagal membuat PDF');
      const today = new Date().toISOString().slice(0, 10);
      const suffix = `${from || 'ALL'}_${to || 'ALL'}${status ? `_${status}` : ''}`;
      const filename = `laporan-booking_${suffix}_${today}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Length', String(pdfBuffer.length));
      return res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err?.message || 'Internal Server Error saat membuat PDF');
    }
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

  @Get('refunds.pdf')
  async refundsPdf(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    try {
      if (from === '') from = undefined;
      if (to === '') to = undefined;
      if (status === '') status = undefined;
      const period = { from: parseDate(from), to: parseDate(to) };
      const report = await this.reportService.generateRefundsReport(period, { status });
      const html = this.reportService.renderRefundsHtml(report);
      const pdfBuffer = await this.pdfService.htmlToPdf(html);
      if (!pdfBuffer) throw new BadRequestException('Gagal membuat PDF');
      const today = new Date().toISOString().slice(0, 10);
      const suffix = `${from || 'ALL'}_${to || 'ALL'}${status ? `_${status}` : ''}`;
      const filename = `laporan-refund_${suffix}_${today}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Length', String(pdfBuffer.length));
      return res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (err: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err?.message || 'Internal Server Error saat membuat PDF');
    }
  }
}
