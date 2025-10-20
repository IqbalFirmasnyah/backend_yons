// src/services/pdf.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';

@Injectable()
export class PdfService implements OnModuleDestroy {
  private browserPromise: Promise<Browser> | null = null;

  private launchBrowser() {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
        ],
        executablePath: process.env.CHROMIUM_PATH || undefined,
      });
    }
    return this.browserPromise;
  }

  async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await this.launchBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    const buf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
    });
    await page.close();
    return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  }

  async onModuleDestroy() {
    if (this.browserPromise) {
      try {
        const b = await this.browserPromise;
        await b.close();
      } catch {}
      this.browserPromise = null;
    }
  }
}
