import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsChannel {
  private readonly logger = new Logger(SmsChannel.name);
  private readonly authKey?: string;
  private readonly senderId: string;

  constructor(config: ConfigService) {
    this.authKey = config.get<string>('MSG91_AUTH_KEY');
    this.senderId = config.get<string>('MSG91_SENDER_ID') ?? 'SERVRA';
  }

  async send(to: string, message: string) {
    const phone = to.replace(/[^\d]/g, '');
    if (!this.authKey) {
      this.logger.log(`[DEV SMS] to=${phone} message="${message}"`);
      return { id: `dev-sms-${Date.now()}`, preview: true };
    }

    const response = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authkey: this.authKey },
      body: JSON.stringify({
        sender: this.senderId,
        mobiles: phone,
        message,
      }),
    });
    if (!response.ok) {
      throw new Error(`MSG91 error ${response.status}: ${await response.text()}`);
    }
    return { id: `msg91-${Date.now()}`, preview: false };
  }
}
