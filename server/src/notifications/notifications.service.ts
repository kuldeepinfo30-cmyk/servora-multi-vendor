import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationChannel, NotificationKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailChannel } from './channels/email.channel';
import { SmsChannel } from './channels/sms.channel';
import { PaginationDto, paginated, skipTake } from '../common/dto/pagination.dto';

export interface NotifyInput {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  channels?: NotificationChannel[];
  email?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly queue: Queue,
    private readonly emailChannel: EmailChannel,
    private readonly smsChannel: SmsChannel,
  ) {}

  /**
   * Persists an in-app notification and dispatches email/SMS through BullMQ.
   * If Redis is down we fall back to inline delivery so nothing is silently lost.
   */
  async send(input: NotifyInput) {
    const channels = input.channels ?? [NotificationChannel.IN_APP];
    let notificationId: string | undefined;

    if (channels.includes(NotificationChannel.IN_APP)) {
      const notification = await this.prisma.notification.create({
        data: {
          userId: input.userId,
          kind: input.kind,
          title: input.title,
          body: input.body,
          href: input.href,
          channels,
        },
      });
      notificationId = notification.id;
    }

    const jobs: Array<{ name: string; data: Record<string, unknown> }> = [];
    if (channels.includes(NotificationChannel.EMAIL) && input.email) {
      jobs.push({
        name: 'email',
        data: { to: input.email, subject: input.title, text: input.body, href: input.href },
      });
    }
    if (channels.includes(NotificationChannel.SMS) && input.phone) {
      jobs.push({ name: 'sms', data: { to: input.phone, message: `${input.title}: ${input.body}` } });
    }

    for (const job of jobs) {
      try {
        await this.queue.add(job.name, job.data);
      } catch (error) {
        this.logger.warn(`Queue unavailable, sending ${job.name} inline`);
        await this.deliverInline(job.name, job.data);
      }
    }

    return { id: notificationId, queued: jobs.length };
  }

  private async deliverInline(name: string, data: Record<string, unknown>) {
    try {
      if (name === 'email') {
        await this.emailChannel.send({
          to: String(data.to),
          subject: String(data.subject),
          text: String(data.text),
        });
      } else if (name === 'sms') {
        await this.smsChannel.send(String(data.to), String(data.message));
      }
    } catch (error) {
      this.logger.warn(`Inline ${name} delivery failed: ${(error as Error).message}`);
    }
  }

  async list(userId: string, query: PaginationDto & { unread?: string; kind?: string }) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.unread === 'true' ? { readAt: null } : {}),
      ...(query.kind ? { kind: query.kind as NotificationKind } : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { ...paginated(data, total, query.page, query.pageSize), unread };
  }

  async markRead(userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Notification not found.');
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Notification not found.');
    await this.prisma.notification.delete({ where: { id } });
    return { deleted: true };
  }
}
