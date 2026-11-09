import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

export interface EmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  href?: string;
}

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly live: boolean;

  constructor(config: ConfigService) {
    this.from = config.get<string>('SMTP_FROM') ?? 'Servora <no-reply@servora.in>';
    const host = config.get<string>('SMTP_HOST');
    this.live = Boolean(host);
    this.transporter = this.live
      ? nodemailer.createTransport({
          host,
          port: Number(config.get('SMTP_PORT') ?? 587),
          secure: Number(config.get('SMTP_PORT') ?? 587) === 465,
          auth: config.get('SMTP_USER')
            ? { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') }
            : undefined,
        })
      : nodemailer.createTransport({ jsonTransport: true });
  }

  async send(input: EmailInput) {
    const html =
      input.html ??
      `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto">
         <h2 style="color:#4338ca">${escapeHtml(input.subject)}</h2>
         <p style="color:#334155;line-height:1.6">${escapeHtml(input.text).replace(/\n/g, '<br/>')}</p>
         ${input.href ? `<p><a href="${escapeHtml(input.href)}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open Servora</a></p>` : ''}
         <p style="color:#94a3b8;font-size:12px">Servora · Local services, minus the hassle.</p>
       </div>`;

    if (!this.live) {
      this.logger.log(`[DEV EMAIL] to=${input.to} subject="${input.subject}" body="${input.text}"`);
      return { id: `dev-${Date.now()}`, preview: true };
    }
    const info = await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html,
    });
    return { id: info.messageId, preview: false };
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char];
  });
}
