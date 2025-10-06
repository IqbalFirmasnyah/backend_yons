import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from 'src/services/mail.service';
import { join } from 'path';
import { existsSync } from 'fs';

function resolveTemplatesDir() {
  const distPath = join(process.cwd(), 'dist', 'src', 'modules', 'mail', 'templates');
  const srcPath  = join(process.cwd(), 'src', 'modules', 'mail', 'templates');


  if (existsSync(distPath)) return distPath;
  if (existsSync(srcPath))  return srcPath;

  throw new Error(
    `Mail templates directory NOT FOUND.\nChecked:\n- ${distPath}\n- ${srcPath}\n` +
    `Pastikan file: src/modules/mail/templates/welcome.hbs`
  );
}

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST'),
          port: parseInt(config.get<string>('MAIL_PORT') || '587', 10),
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"${config.get<string>('MAIL_FROM_NAME') || 'No-Reply'}" <${config.get<string>('MAIL_FROM_ADDRESS') || 'no-reply@example.com'}>`,
        },
        template: { 
          dir: resolveTemplatesDir(),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
