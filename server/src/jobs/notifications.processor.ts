import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailChannel } from '../notifications/channels/email.channel';
import { SmsChannel } from '../notifications/channels/sms.channel';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly email: EmailChannel,
    private readonly sms: SmsChannel,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case 'email':
        return this.email.send({
          to: String(job.data.to),
          subject: String(job.data.subject),
          text: String(job.data.text),
          href: job.data.href as string | undefined,
        });
      case 'sms':
        return this.sms.send(String(job.data.to), String(job.data.message));
      default:
        this.logger.warn(`Unknown notification job: ${job.name}`);
        return { skipped: true };
    }
  }
}
