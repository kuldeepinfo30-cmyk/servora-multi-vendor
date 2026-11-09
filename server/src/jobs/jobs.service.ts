import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingStatus, CouponStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Payment holds expire after 20 minutes. Expiring them here keeps the
   * availability engine honest even if the customer abandons checkout.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireUnpaidBookings() {
    try {
      const result = await this.prisma.booking.updateMany({
        where: {
          status: BookingStatus.PENDING_PAYMENT,
          expiresAt: { lt: new Date() },
          paymentStatus: 'PENDING',
        },
        data: { status: BookingStatus.EXPIRED, cancelledAt: new Date(), cancellationReason: 'Payment hold expired' },
      });
      if (result.count) this.logger.log(`Expired ${result.count} unpaid booking hold(s)`);
    } catch (error) {
      this.logger.warn(`Booking expiry job skipped: ${(error as Error).message}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async refreshCouponStatuses() {
    try {
      const now = new Date();
      const [expired, activated] = await this.prisma.$transaction([
        this.prisma.coupon.updateMany({
          where: { status: CouponStatus.ACTIVE, expiresAt: { lte: now } },
          data: { status: CouponStatus.EXPIRED },
        }),
        this.prisma.coupon.updateMany({
          where: { status: CouponStatus.SCHEDULED, startsAt: { lte: now }, expiresAt: { gt: now } },
          data: { status: CouponStatus.ACTIVE },
        }),
      ]);
      if (expired.count || activated.count) {
        this.logger.log(`Coupons refreshed: ${activated.count} activated, ${expired.count} expired`);
      }
    } catch (error) {
      this.logger.warn(`Coupon status job skipped: ${(error as Error).message}`);
    }
  }

  /** Daily hygiene: close stale in-progress bookings that were never completed. */
  @Cron('0 3 * * *')
  async closeStaleBookings() {
    try {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const result = await this.prisma.booking.updateMany({
        where: { status: BookingStatus.IN_PROGRESS, endsAt: { lt: cutoff } },
        data: { status: BookingStatus.COMPLETED, completedAt: new Date() },
      });
      if (result.count) this.logger.log(`Auto-completed ${result.count} stale booking(s)`);
    } catch (error) {
      this.logger.warn(`Stale booking job skipped: ${(error as Error).message}`);
    }
  }
}
