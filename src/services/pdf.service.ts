import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true, // ✅ pakai boolean, bukan 'new'
      // Jika di server Linux/docker:
      // args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // page.pdf() -> Uint8Array pada puppeteer versi terbaru
      const pdfUint8 = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '16mm', right: '14mm', bottom: '16mm', left: '14mm' },
      });

      // ✅ konversi ke Buffer agar sesuai dengan return type
      return Buffer.from(pdfUint8);
    } finally {
      await browser.close();
    }
  }
}
