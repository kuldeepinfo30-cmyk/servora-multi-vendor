import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingStatus,
  NotificationChannel,
  NotificationKind,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { paginated, PaginationDto, skipTake } from '../common/dto/pagination.dto';
import { RefundDto, VerifyPaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly bookings: BookingsService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  configInfo() {
    return {
      provider: 'razorpay',
      currency: this.config.get('RAZORPAY_CURRENCY') ?? 'INR',
      keyId: this.razorpay.publicKey,
      mock: !this.razorpay.configured,
      demoPayEnabled: this.config.get('NODE_ENV') !== 'production',
    };
  }

  async createOrder(user: AuthUser, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: { select: { email: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.customerId !== user.id) throw new ForbiddenException('This booking belongs to another customer.');
    if (booking.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('This booking is already paid.');
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException('This booking is not awaiting payment.');
    }

    const order = await this.razorpay.createOrder({
      amountPaise: booking.totalPaise,
      receipt: booking.ref,
      notes: { bookingId: booking.id, customerId: user.id },
    });

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: order.mock ? 'MOCK' : 'RAZORPAY',
        providerOrderId: order.id,
        amountPaise: booking.totalPaise,
        currency: order.currency,
        status: TransactionStatus.PENDING,
        receipt: booking.ref,
        rawPayload: order as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      paymentId: payment.id,
      orderId: order.id,
      amountPaise: booking.totalPaise,
      currency: order.currency,
      keyId: this.razorpay.publicKey,
      mock: order.mock,
      bookingRef: booking.ref,
      prefill: { email: booking.customer.email },
    };
  }

  async verify(user: AuthUser, dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerOrderId: dto.razorpay_order_id },
      include: { booking: true },
    });
    if (!payment) throw new NotFoundException('Payment order not found.');
    if (payment.booking.customerId !== user.id) throw new ForbiddenException('This payment belongs to another customer.');

    const valid = this.razorpay.verifyPaymentSignature(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );
    if (!valid) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: TransactionStatus.FAILED, failureReason: 'Signature mismatch' },
      });
      throw new BadRequestException('Payment signature verification failed.');
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: TransactionStatus.SUCCESS,
          providerPaymentId: dto.razorpay_payment_id,
          signatureVerified: true,
          capturedAt: new Date(),
          rawPayload: dto as unknown as Prisma.InputJsonValue,
        },
      }),
      this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: PaymentStatus.PAID, paymentMethod: PaymentMethod.UPI },
      }),
    ]);

    const booking = await this.bookings.markPaid(payment.bookingId, PaymentMethod.UPI);
    return { verified: true, booking };
  }

  /** Sandbox-only shortcut so the demo remains fully usable without Razorpay keys. */
  async mockPay(user: AuthUser, bookingId: string, method: PaymentMethod = PaymentMethod.UPI) {
    if (this.config.get('NODE_ENV') === 'production' && this.config.get('ENABLE_DEMO_LOGIN') !== 'true') {
      throw new ForbiddenException('Demo payments are disabled in production.');
    }
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.customerId !== user.id) throw new ForbiddenException('This booking belongs to another customer.');
    if (booking.paymentStatus === PaymentStatus.PAID) {
      return { paid: true, booking: await this.bookings.detail(user, bookingId) };
    }

    await this.prisma.payment.create({
      data: {
        bookingId,
        provider: 'MOCK',
        providerOrderId: `order_mock_${Date.now()}`,
        providerPaymentId: `pay_mock_${Date.now()}`,
        amountPaise: booking.totalPaise,
        status: TransactionStatus.SUCCESS,
        method,
        signatureVerified: true,
        capturedAt: new Date(),
        receipt: booking.ref,
      },
    });

    const paid = await this.bookings.markPaid(bookingId, method);
    return { paid: true, booking: paid };
  }

  async webhook(rawBody: Buffer | string, signature: string | undefined) {
    if (!signature) throw new BadRequestException('Missing Razorpay-Signature header.');
    if (!this.razorpay.verifyWebhook(rawBody, signature)) {
      throw new ForbiddenException('Invalid webhook signature.');
    }

    const payload = JSON.parse(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')) as {
      event: string;
      payload?: Record<string, { entity?: Record<string, unknown> }>;
    };
    const eventId =
      (payload.payload?.payment?.entity?.id as string | undefined) ??
      `${payload.event}-${Date.now()}`;

    const existing = await this.prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing?.status === 'processed') return { received: true, duplicate: true };

    const event = await this.prisma.webhookEvent.upsert({
      where: { eventId },
      create: {
        provider: 'razorpay',
        eventId,
        type: payload.event,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
      update: { payload: payload as unknown as Prisma.InputJsonValue },
    });

    try {
      if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
        const entity = payload.payload?.payment?.entity ?? {};
        const orderId = entity.order_id as string | undefined;
        const paymentId = entity.id as string | undefined;
        if (orderId) {
          const payment = await this.prisma.payment.findUnique({ where: { providerOrderId: orderId } });
          if (payment && payment.status !== TransactionStatus.SUCCESS) {
            await this.prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: TransactionStatus.SUCCESS,
                providerPaymentId: paymentId,
                signatureVerified: true,
                capturedAt: new Date(),
                rawPayload: payload as unknown as Prisma.InputJsonValue,
              },
            });
            await this.bookings.markPaid(payment.bookingId, PaymentMethod.UPI);
          }
        }
      }

      if (payload.event === 'payment.failed') {
        const entity = payload.payload?.payment?.entity ?? {};
        const orderId = entity.order_id as string | undefined;
        if (orderId) {
          const payment = await this.prisma.payment.findUnique({ where: { providerOrderId: orderId } });
          if (payment) {
            await this.prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: TransactionStatus.FAILED,
                failureReason: (entity.error_description as string) ?? 'Payment failed',
              },
            });
          }
        }
      }

      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: 'processed', processedAt: new Date() },
      });
    } catch (error) {
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: 'failed', error: (error as Error).message },
      });
      throw error;
    }

    return { received: true };
  }

  async refund(admin: AuthUser, dto: RefundDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { payments: { where: { status: 'SUCCESS' }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.paymentStatus !== PaymentStatus.PAID && booking.paymentStatus !== PaymentStatus.PARTIAL) {
      throw new BadRequestException('This booking has no captured payment to refund.');
    }

    const amountPaise = Math.min(dto.amountPaise ?? booking.totalPaise, booking.totalPaise);
    const payment = booking.payments[0];
    const gatewayRefund = payment?.providerPaymentId
      ? await this.razorpay.refund(payment.providerPaymentId, amountPaise, { reason: dto.reason })
      : { id: `rfnd_manual_${Date.now()}`, mock: true };

    const [refund] = await this.prisma.$transaction([
      this.prisma.refund.create({
        data: {
          bookingId: booking.id,
          paymentId: payment?.id,
          amountPaise,
          reason: dto.reason,
          status: TransactionStatus.SUCCESS,
          providerRefundId: gatewayRefund.id,
          processedById: admin.id,
          processedAt: new Date(),
        },
      }),
      this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: amountPaise >= booking.totalPaise ? PaymentStatus.REFUNDED : PaymentStatus.PARTIAL,
          status: amountPaise >= booking.totalPaise ? BookingStatus.REFUNDED : booking.status,
        },
      }),
      this.prisma.ledgerEntry.create({
        data: {
          vendorId: booking.vendorId,
          bookingId: booking.id,
          type: TransactionType.REFUND,
          amountPaise: -amountPaise,
          description: `Refund for ${booking.ref} — ${dto.reason}`,
        },
      }),
    ]);

    await this.notifications
      .send({
        userId: booking.customerId,
        kind: NotificationKind.PAYMENT,
        title: `Refund processed — ${booking.ref}`,
        body: `₹${(amountPaise / 100).toLocaleString('en-IN')} has been refunded to your original payment method.`,
        href: '/customer/payments',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      })
      .catch(() => undefined);

    return { refund: { ...refund, amount: refund.amountPaise / 100 }, gateway: gatewayRefund };
  }

  async adminList(query: PaginationDto & { status?: string; type?: string }) {
    const where: Prisma.PaymentWhereInput = {
      ...(query.status ? { status: query.status as TransactionStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { providerOrderId: { contains: query.search, mode: 'insensitive' } },
              { providerPaymentId: { contains: query.search, mode: 'insensitive' } },
              { booking: { ref: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { booking: { select: { ref: true, customer: { select: { name: true } }, vendor: { select: { name: true } } } } },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async revenueStats() {
    const [captured, refunded, pending] = await this.prisma.$transaction([
      this.prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amountPaise: true }, _count: true }),
      this.prisma.refund.aggregate({ where: { status: 'SUCCESS' }, _sum: { amountPaise: true }, _count: true }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
    ]);
    return {
      capturedPaise: captured._sum.amountPaise ?? 0,
      payments: captured._count,
      refundedPaise: refunded._sum.amountPaise ?? 0,
      refunds: refunded._count,
      pending,
    };
  }
}
