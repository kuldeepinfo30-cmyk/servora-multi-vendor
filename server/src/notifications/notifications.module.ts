import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailChannel } from './channels/email.channel';
import { SmsChannel } from './channels/sms.channel';

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: 'notifications' })],
  providers: [NotificationsService, EmailChannel, SmsChannel],
  controllers: [NotificationsController],
  exports: [NotificationsService, EmailChannel, SmsChannel],
})
export class NotificationsModule {}
