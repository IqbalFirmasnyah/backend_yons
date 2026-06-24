import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

type BookingMailPayload = {
  bookingId: number;
  kodeBooking: string;
  tanggalBooking: Date;
  tanggalMulaiWisata: Date;
  tanggalSelesaiWisata: Date;
  estimasiHarga: Prisma.Decimal | number | string;
  jumlahPeserta: number;
  statusBooking: string;
  user?: { namaLengkap?: string | null; email?: string | null } | null;
  supir?: { namaSupir?: string | null } | null;
  armada?: { namaArmada?: string | null } | null;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  private get appName() {
    return this.config.get<string>('APP_NAME') || 'YonsTrans';
  }
  private get appUrl() {
    return this.config.get<string>('APP_URL') || '';
  }
  private get fromDefault() {
    // defaults.from sudah di-set di MailerModule; ini sekadar fallback
    return (
      this.config.get<string>('MAIL_FROM') ||
      `"${this.config.get<string>('MAIL_FROM_NAME') || 'No-Reply'}" <${this.config.get<string>('MAIL_FROM_ADDRESS') || 'no-reply@example.com'}>`
    );
  }
  private get adminEmailsEnv(): string[] {
    return (this.config.get<string>('ADMIN_EMAILS') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // ====================== PUBLIC APIS ======================

  /** Kirim email welcome (pakai template "welcome.hbs" jika ada). */
  async sendWelcomeEmail(to: string, namaLengkap?: string) {
    const name = namaLengkap || 'Pengguna';
    try {
      await this.mailer.sendMail({
        to,
        from: this.fromDefault,
        subject: 'Selamat datang! Akun kamu berhasil dibuat ✅',
        template: 'welcome',
        context: { nama: name, appName: this.appName, appUrl: this.appUrl },
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (err) {
      this.logger.warn(
        `Template welcome gagal, fallback HTML inline. Reason: ${(err as Error)?.message}`,
      );
      try {
        await this.mailer.sendMail({
          to,
          from: this.fromDefault,
          subject: 'Selamat datang! Akun kamu berhasil dibuat ✅',
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;">
              <p>Halo <b>${this.escapeHtml(name)}</b>,</p>
              <p>Selamat datang di <b>${this.escapeHtml(this.appName)}</b>! Akun kamu berhasil dibuat.</p>
              ${this.appUrl ? `<p><a href="${this.appUrl}" target="_blank" rel="noopener noreferrer">${this.appUrl}</a></p>` : ''}
              <p>Terima kasih 🤗</p>
            </div>
          `,
          text: `Halo ${name},

Selamat datang di ${this.appName}! Akun kamu berhasil dibuat.
${this.appUrl ? `Kunjungi: ${this.appUrl}` : ''}

Terima kasih.`,
        });
        this.logger.log(`Welcome email (fallback) sent to ${to}`);
      } catch (e2) {
        this.logger.error(`Failed to send welcome email to ${to}`, (e2 as Error)?.stack);
      }
    }
  }

  /** Kirim email reset password (pakai template "reset-password.hbs" jika ada). */
  async sendPasswordResetEmail(
    to: string,
    namaLengkap: string | null,
    codeHash: string,
    expiresText = '15 menit',
  ) {
    const name = namaLengkap || 'Pengguna';
    try {
      await this.mailer.sendMail({
        to,
        from: this.fromDefault,
        subject: 'Kode Reset Password',
        template: 'reset-password',
        context: {
          nama: name,
          codeHash,
          expiresAt: expiresText,
          appName: this.appName,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Reset password email sent to ${to}`);
    } catch (err) {
      this.logger.warn(
        `Template reset-password gagal, fallback HTML inline. Reason: ${(err as Error)?.message}`,
      );
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;">
          <p>Halo <b>${this.escapeHtml(name)}</b>,</p>
          <p>Permintaan reset password diterima.</p>
          <p>Gunakan kode berikut (berlaku ${this.escapeHtml(expiresText)}):</p>
          <p style="font-size:20px;font-weight:bold;letter-spacing:2px;">${this.escapeHtml(codeHash)}</p>
          <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
          ${this.appUrl ? `<p><a href="${this.appUrl}" target="_blank" rel="noopener noreferrer">${this.appUrl}</a></p>` : ''}
          <p>Terima kasih, <br/>${this.escapeHtml(this.appName)}</p>
        </div>
      `;
      const text = `Halo ${name},

Permintaan reset password diterima.
Gunakan kode berikut (berlaku ${expiresText}):

${codeHash}

Jika Anda tidak meminta reset password, abaikan email ini.
${this.appUrl ? `\n${this.appUrl}\n` : ''}

Terima kasih,
${this.appName}`;
      await this.mailer.sendMail({ to, from: this.fromDefault, subject: 'Kode Reset Password', html, text });
      this.logger.log(`Reset password email (fallback) sent to ${to}`);
    }
  }

  /** Notifikasi ke Admin saat ada booking baru. */
  async sendBookingNewAdmins(booking: BookingMailPayload, dashboardUrl?: string) {
    const toList = this.adminEmailsEnv;
    if (!toList.length) {
      this.logger.warn('ADMIN_EMAILS kosong. Lewati pengiriman notifikasi booking baru.');
      return;
    }

    const mulai = new Date(booking.tanggalMulaiWisata);
    const selesai = new Date(booking.tanggalSelesaiWisata);
    const tglBooking = new Date(booking.tanggalBooking);

    const bookingContext = {
      kodeBooking: booking.kodeBooking,
      tanggalBookingText: tglBooking.toLocaleString('id-ID'),
      periodeText: `${mulai.toLocaleDateString('id-ID')} s/d ${selesai.toLocaleDateString('id-ID')}`,
      jumlahPeserta: booking.jumlahPeserta,
      estimasiHargaText: this.fmtIDR(booking.estimasiHarga),
      statusBooking: booking.statusBooking,
      userText:
        booking.user?.namaLengkap || booking.user?.email
          ? `${booking.user?.namaLengkap || ''}${booking.user?.email ? ` (${booking.user.email})` : ''}`
          : null,
      supirText: booking.supir?.namaSupir || null,
      armadaText: booking.armada?.namaArmada || null,
    };

    try {
      await this.mailer.sendMail({
        to: toList,
        from: this.fromDefault,
        subject: `Booking Baru: ${booking.kodeBooking}`,
        template: 'booking-new',
        context: {
          appName: this.appName,
          dashboardUrl: dashboardUrl || (this.appUrl ? `${this.appUrl}/admin/bookings/${booking.bookingId}` : ''),
          booking: bookingContext,
        },
      });
      this.logger.log(`Notifikasi booking ${booking.kodeBooking} terkirim ke admin.`);
    } catch (err) {
      this.logger.warn(`Template booking-new gagal, fallback inline: ${(err as Error)?.message}`);
      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
          <h2>Booking Baru Masuk</h2>
          <p>Ada booking baru yang perlu ditinjau oleh Admin.</p>
          <p><strong>Kode Booking:</strong> ${this.escapeHtml(bookingContext.kodeBooking)}</p>
          <p><strong>Tanggal Booking:</strong> ${this.escapeHtml(bookingContext.tanggalBookingText)}</p>
          <p><strong>Periode Layanan:</strong> ${this.escapeHtml(bookingContext.periodeText)}</p>
          <p><strong>Jumlah Peserta:</strong> ${bookingContext.jumlahPeserta}</p>
          <p><strong>Estimasi Harga:</strong> ${this.escapeHtml(bookingContext.estimasiHargaText)}</p>
          <p><strong>Status:</strong> ${this.escapeHtml(bookingContext.statusBooking)}</p>
          ${bookingContext.userText ? `<p><strong>Pemesan:</strong> ${this.escapeHtml(bookingContext.userText)}</p>` : ''}
          ${bookingContext.supirText ? `<p><strong>Supir:</strong> ${this.escapeHtml(bookingContext.supirText)}</p>` : ''}
          ${bookingContext.armadaText ? `<p><strong>Armada:</strong> ${this.escapeHtml(bookingContext.armadaText)}</p>` : ''}
          ${this.appUrl ? `<p style="margin-top:12px;"><a href="${this.appUrl}/admin/bookings/${booking.bookingId}" target="_blank" rel="noopener noreferrer">Lihat di Dashboard</a></p>` : ''}
          <p style="color:#666;font-size:12px;margin-top:16px;">Email otomatis — mohon tidak membalas.</p>
          <p style="color:#666;font-size:12px;margin-top:0;">${this.escapeHtml(this.appName)}</p>
        </div>
      `;
      try {
        await this.mailer.sendMail({
          to: toList,
          from: this.fromDefault,
          subject: `Booking Baru: ${booking.kodeBooking}`,
          html,
        });
        this.logger.log(`Notifikasi booking (fallback) ${booking.kodeBooking} terkirim ke admin.`);
      } catch (e2) {
        this.logger.error(`Gagal kirim email notifikasi booking ${booking.kodeBooking}`, (e2 as Error)?.stack);
      }
    }
  }

  // ====================== Utils ======================

  private escapeHtml(input: string) {
    return String(input)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private fmtIDR(val: Prisma.Decimal | number | string) {
    const n =
      typeof val === 'string'
        ? Number(val)
        : (val as any)?._value ?? Number(val as number);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(isNaN(n) ? 0 : n);
  }
}
