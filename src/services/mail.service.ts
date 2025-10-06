// src/services/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

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
    // MailerModule.defaults.from biasanya sudah di-set; ini hanya fallback
    return (
      this.config.get<string>('MAIL_FROM') ||
      `no-reply@${this.appName.toLowerCase()}.com`
    );
  }

  /**
   * Kirim email welcome.
   * - Coba pakai template "welcome" (welcome.hbs)
   * - Jika template tidak ada / gagal, fallback ke HTML inline
   * - Jangan lempar error (registrasi user tetap sukses)
   */
  async sendWelcomeEmail(to: string, namaLengkap?: string) {
    const name = namaLengkap || 'Pengguna';
    try {
      // Coba kirim via template
      await this.mailer.sendMail({
        to,
        from: this.fromDefault,
        subject: 'Selamat datang! Akun kamu berhasil dibuat ✅',
        template: 'welcome', // butuh template: src/mail/templates/welcome.hbs
        context: {
          nama: name,
          appName: this.appName,
          appUrl: this.appUrl,
        },
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (err) {
      // Fallback ke HTML inline (hindari crash kalau template tidak ada)
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
              ${
                this.appUrl
                  ? `<p>Kamu bisa mulai di sini: <a href="${this.appUrl}" target="_blank" rel="noopener noreferrer">${this.appUrl}</a></p>`
                  : ''
              }
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
        // Jangan throw supaya registrasi tetap sukses
        this.logger.error(
          `Failed to send welcome email to ${to}`,
          (e2 as Error)?.stack,
        );
      }
    }
  }

  /**
   * Kirim email reset password berisi kode OTP.
   * - Coba pakai template "reset-password" (reset-password.hbs)
   * - Jika template tidak ada / gagal, fallback ke HTML/text
   * - Boleh lempar error ke caller (agar FE bisa tampilkan pesan gagal kirim kode)
   * @param expiresText contoh: "15 menit", atau string custom lain
   */
  async sendPasswordResetEmail(
    to: string,
    namaLengkap: string | null,
    codeHash: string,
    expiresText = '15 menit',
  ) {
    const name = namaLengkap || 'Pengguna';

    try {
      // Coba via template
      await this.mailer.sendMail({
        to,
        from: this.fromDefault,
        subject: 'Kode Reset Password',
        template: 'reset-password', // butuh template: src/mail/templates/reset-password.hbs
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
      // Fallback HTML + text
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

      try {
        await this.mailer.sendMail({
          to,
          from: this.fromDefault,
          subject: 'Kode Reset Password',
          html,
          text,
        });
        this.logger.log(`Reset password email (fallback) sent to ${to}`);
      } catch (e2) {
        this.logger.error(
          `Failed to send reset password email to ${to}`,
          (e2 as Error)?.stack,
        );
        // Biar FE tahu gagal kirim kode
        throw e2;
      }
    }
  }

  // --- Utils kecil ---

  /** Escape minimal untuk HTML inline (hindari injection sederhana) */
  private escapeHtml(input: string) {
    return String(input)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
