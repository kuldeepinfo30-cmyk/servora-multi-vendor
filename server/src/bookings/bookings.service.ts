import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { AvailabilityService } from '../availability/availability.service';
import { CouponsService } from '../coupons/coupons.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { bookingRef } from '../common/utils/refs';
import { commissionSplit, roundPaise } from '../common/utils/money';
import { addMinutes } from '../common/utils/time';
import { paginated, skipTake } from '../common/dto/pagination.dto';
import {
  BookingQueryDto,
  CancelBookingDto,
  CreateBookingDto,
  QuoteBookingDto,
  RescheduleBookingDto,
  VendorBookingStatusDto,
} from './dto/booking.dto';

const BOOKING_INCLUDE = {
  service: {
    select: {
      id: true,
      slug: true,
      name: true,
      imageUrl: true,
      durationMin: true,
      pricePaise: true,
      cancellationPolicy: true,
    },
  },
  vendor: {
    select: { id: true, slug: true, name: true, city: true, area: true, phone: true, coverUrl: true, rating: true },
  },
  customer: { select: { id: true, name: true, email: true, phone: true } },
  staff: { select: { id: true, name: true, role: true } },
  address: true,
  coupon: { select: { id: true, code: true, type: true, value: true } },
  payments: { orderBy: { createdAt: 'desc' as const }, take: 3 },
  review: { select: { id: true, rating: true } },
  dispute: { select: { id: true, status: true } },
} satisfies Prisma.BookingInclude;

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PENDING_APPROVAL,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.CANCELLATION_REQUESTED,
];

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly coupons: CouponsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------------------------------- Quote ---------------------------------

  async quote(dto: QuoteBookingDto, userId: string, db: Prisma.TransactionClient | PrismaService = this.prisma) {
    const service = await db.service.findUnique({
      where: { id: dto.serviceId },
      include: {
        addOns: true,
        vendor: { select: { id: true, status: true, commissionRate: true, name: true } },
      },
    });
    if (!service) throw new NotFoundException('Service not found.');
    if (service.status !== 'PUBLISHED' || service.vendor.status !== 'APPROVED') {
      throw new BadRequestException('This service is not accepting bookings.');
    }

    const addOnIds = dto.addOnIds ?? [];
    const selected = service.addOns.filter((addOn) => addOnIds.includes(addOn.id));
    if (selected.length !== addOnIds.length) {
      throw new BadRequestException('One or more add-ons are not available for this service.');
    }
    const addOnsPaise = selected.reduce((sum, addOn) => sum + addOn.pricePaise, 0);
    const amountPaise = service.pricePaise;
    const subtotalPaise = amountPaise + addOnsPaise;

    let discountPaise = 0;
    let coupon: { id: string; code: string } | null = null;
    if (dto.couponCode) {
      const result = await this.coupons.validate(
        {
          code: dto.couponCode,
          amountPaise: subtotalPaise,
          vendorId: service.vendorId,
          serviceId: service.id,
        },
        userId,
        db,
      );
      discountPaise = result.discountPaise;
      coupon = { id: result.coupon.id, code: result.coupon.code };
    }

    const totalPaise = Math.max(0, subtotalPaise - discountPaise);
    const commissionRate = Number(service.vendor.commissionRate);
    const { platformFeePaise, vendorPaise } = commissionSplit(totalPaise, commissionRate);

    return {
      serviceId: service.id,
      serviceName: service.name,
      vendorId: service.vendorId,
      vendorName: service.vendor.name,
      durationMin: service.durationMin,
      amountPaise,
      addOnsPaise,
      addOns: selected.map((addOn) => ({
        id: addOn.id,
        name: addOn.name,
        pricePaise: addOn.pricePaise,
        durationMin: addOn.durationMin,
      })),
      subtotalPaise,
      discountPaise,
      coupon,
      totalPaise,
      platformFeePaise,
      vendorPaise,
      commissionRate,
      currency: 'INR',
    };
  }

  // --------------------------------- Create ---------------------------------

  async create(customerId: string, dto: CreateBookingDto, idempotencyKey?: string) {
    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new BadRequestException('Invalid booking time.');
    if (startsAt <= new Date()) throw new BadRequestException('Choose a time in the future.');

    if (idempotencyKey) {
      const existing = await this.prisma.idempotencyKey.findFirst({
        where: { key: idempotencyKey, userId: customerId },
      });
      if (existing?.response) return existing.response as unknown as Record<string, unknown>;
    }

    const booking = await this.withSerializableRetry(async (tx) => {
      const service = await tx.service.findUnique({
        where: { id: dto.serviceId },
        select: { id: true, vendorId: true, name: true, durationMin: true },
      });
      if (!service) throw new NotFoundException('Service not found.');

      // Serialize concurrent attempts for this vendor. Combined with SERIALIZABLE
      // isolation and the overlap check below, this prevents double booking.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking:${service.vendorId}`}))::text`;

      const slot = await this.availability.assertSlotAvailable(tx, {
        serviceId: dto.serviceId,
        startsAt,
        staffId: dto.staffId,
      });

      const quote = await this.quote(dto, customerId, tx);

      let addressSnapshot: Prisma.InputJsonValue | undefined;
      if (dto.addressId) {
        const address = await tx.address.findFirst({ where: { id: dto.addressId, userId: customerId } });
        if (!address) throw new BadRequestException('Selected address was not found.');
        addressSnapshot = {
          label: address.label,
          name: address.name,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          phone: address.phone,
        } as Prisma.InputJsonValue;
      }

      const method = dto.paymentMethod ?? PaymentMethod.UPI;
      const payLater = method === PaymentMethod.CASH;
      const status = payLater ? BookingStatus.PENDING_APPROVAL : BookingStatus.PENDING_PAYMENT;
      const endsAt = addMinutes(startsAt, quote.durationMin);

      const created = await tx.booking.create({
        data: {
          ref: bookingRef(),
          customerId,
          vendorId: quote.vendorId,
          serviceId: quote.serviceId,
          staffId: slot.staffId,
          addressId: dto.addressId,
          couponId: quote.coupon?.id,
          startsAt,
          endsAt,
          durationMin: quote.durationMin,
          status,
          amountPaise: quote.amountPaise,
          addOnsPaise: quote.addOnsPaise,
          discountPaise: quote.discountPaise,
          platformFeePaise: quote.platformFeePaise,
          taxPaise: 0,
          totalPaise: quote.totalPaise,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: method,
          addressSnapshot,
          notes: dto.notes,
          participants: dto.participants ?? 1,
          addOnIds: dto.addOnIds ?? [],
          expiresAt: payLater ? null : addMinutes(new Date(), 20),
          idempotencyKey: idempotencyKey ?? null,
        },
        include: BOOKING_INCLUDE,
      });

      if (quote.coupon) {
        await this.coupons.redeem(tx, {
          couponId: quote.coupon.id,
          userId: customerId,
          bookingId: created.id,
          discountPaise: quote.discountPaise,
        });
      }

      if (idempotencyKey) {
        await tx.idempotencyKey.create({
          data: {
            key: idempotencyKey,
            userId: customerId,
            endpoint: 'POST /bookings',
            response: serializeBooking(created) as unknown as Prisma.InputJsonValue,
          },
        });
      }

      return created;
    });

    await this.notifyCreated(booking);
    return serializeBooking(booking);
  }

  private async withSerializableRetry<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(fn, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15_000,
          maxWait: 5_000,
        });
      } catch (error) {
        lastError = error;
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          ['P2034', 'P2002'].includes(error.code);
        if (!retryable || attempt === 2) break;
        await new Promise((resolve) => setTimeout(resolve, 80 * (attempt + 1)));
      }
    }
    throw lastError;
  }

  private async notifyCreated(booking: Awaited<ReturnType<BookingsService['create']>> | any) {
    const vendorOwner = await this.prisma.vendor
      .findUnique({ where: { id: booking.vendorId }, select: { ownerId: true, owner: { select: { email: true } } } })
      .catch(() => null);
    const when = new Date(booking.startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    await Promise.all([
      this.notifications
        .send({
          userId: booking.customerId,
          kind: NotificationKind.BOOKING,
          title: `Booking ${booking.ref} received`,
          body: `${booking.service?.name ?? 'Your service'} on ${when}. ${booking.status === 'PENDING_PAYMENT' ? 'Complete payment to confirm.' : 'Awaiting vendor confirmation.'}`,
          href: `/customer/bookings/${booking.id}`,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
          email: booking.customer?.email,
          phone: booking.customer?.phone,
        })
        .catch(() => undefined),
      vendorOwner
        ? this.notifications
            .send({
              userId: vendorOwner.ownerId,
              kind: NotificationKind.BOOKING,
              title: `New booking ${booking.ref}`,
              body: `${booking.customer?.name ?? 'A customer'} booked ${booking.service?.name ?? 'a service'} for ${when}.`,
              href: '/vendor/bookings',
              channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
              email: vendorOwner.owner.email,
              phone: booking.vendor?.phone,
            })
            .catch(() => undefined)
        : Promise.resolve(),
    ]);
  }

  // ---------------------------------- Read ----------------------------------

  async list(user: AuthUser, query: BookingQueryDto) {
    const where: Prisma.BookingWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            startsAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(user.role === 'CUSTOMER'
        ? { customerId: user.id }
        : user.role === 'VENDOR'
          ? { vendorId: user.vendorId ?? '__none__' }
          : {
              ...(query.vendorId ? { vendorId: query.vendorId } : {}),
              ...(query.customerId ? { customerId: query.customerId } : {}),
            }),
      ...(query.search
        ? {
            OR: [
              { ref: { contains: query.search, mode: 'insensitive' } },
              { service: { name: { contains: query.search, mode: 'insensitive' } } },
              { customer: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({ where, skip, take, orderBy: { startsAt: 'desc' }, include: BOOKING_INCLUDE }),
      this.prisma.booking.count({ where }),
    ]);
    return paginated(rows.map(serializeBooking), total, query.page, query.pageSize);
  }

  async detail(user: AuthUser, id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        ...BOOKING_INCLUDE,
        refunds: { orderBy: { createdAt: 'desc' } },
        conversation: { select: { id: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    this.assertAccess(user, booking);
    return serializeBooking(booking);
  }

  // -------------------------------- Lifecycle --------------------------------

  async cancel(user: AuthUser, id: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { ...BOOKING_INCLUDE, refunds: true },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    this.assertAccess(user, booking);
    if (([BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REFUNDED, BookingStatus.EXPIRED] as BookingStatus[]).includes(booking.status)) {
      throw new BadRequestException('This booking can no longer be cancelled.');
    }

    const hoursUntil = (booking.startsAt.getTime() - Date.now()) / (60 * 60 * 1000);
    if (user.role === 'CUSTOMER' && hoursUntil < 2) {
      throw new BadRequestException('Less than 2 hours before the service — contact support to cancel.');
    }

    const paid = booking.paymentStatus === PaymentStatus.PAID;
    let refundPaise = 0;
    if (paid) {
      if (hoursUntil >= 24) refundPaise = booking.totalPaise;
      else if (hoursUntil >= 4) refundPaise = roundPaise(booking.totalPaise * 0.5);
      else refundPaise = 0;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (refundPaise > 0) {
        const payment = await tx.payment.findFirst({ where: { bookingId: booking.id, status: 'SUCCESS' } });
        await tx.refund.create({
          data: {
            bookingId: booking.id,
            paymentId: payment?.id,
            amountPaise: refundPaise,
            reason: dto.reason,
            status: TransactionStatus.SUCCESS,
            processedAt: new Date(),
          },
        });
        await tx.ledgerEntry.create({
          data: {
            vendorId: booking.vendorId,
            bookingId: booking.id,
            type: TransactionType.REFUND,
            amountPaise: -refundPaise,
            description: `Refund for ${booking.ref} — ${dto.reason}`,
          },
        });
      }
      return tx.booking.update({
        where: { id },
        data: {
          status: refundPaise === booking.totalPaise && refundPaise > 0 ? BookingStatus.REFUNDED : BookingStatus.CANCELLED,
          paymentStatus:
            refundPaise === 0
              ? booking.paymentStatus
              : refundPaise === booking.totalPaise
                ? PaymentStatus.REFUNDED
                : PaymentStatus.PARTIAL,
          cancellationReason: dto.reason,
          cancelledAt: new Date(),
        },
        include: BOOKING_INCLUDE,
      });
    });

    await this.notifications
      .send({
        userId: booking.customerId,
        kind: NotificationKind.BOOKING,
        title: `Booking ${booking.ref} cancelled`,
        body: refundPaise > 0 ? `A refund of ₹${(refundPaise / 100).toLocaleString('en-IN')} is on its way.` : 'Your booking has been cancelled.',
        href: '/customer/bookings',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        email: booking.customer?.email,
      })
      .catch(() => undefined);

    return serializeBooking(updated);
  }

  async reschedule(user: AuthUser, id: string, dto: RescheduleBookingDto) {
    const startsAt = new Date(dto.startsAt);
    if (startsAt <= new Date()) throw new BadRequestException('Choose a future time.');
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found.');
    this.assertAccess(user, booking);
    if (!([BookingStatus.CONFIRMED, BookingStatus.PENDING_APPROVAL, BookingStatus.PENDING_PAYMENT] as BookingStatus[]).includes(booking.status)) {
      throw new BadRequestException('This booking cannot be rescheduled.');
    }

    const updated = await this.withSerializableRetry(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking:${booking.vendorId}`}))::text`;
      const slot = await this.availability.assertSlotAvailable(tx, {
        serviceId: booking.serviceId,
        startsAt,
        staffId: dto.staffId ?? booking.staffId,
      });
      return tx.booking.update({
        where: { id },
        data: {
          startsAt,
          endsAt: addMinutes(startsAt, booking.durationMin),
          staffId: slot.staffId,
          status: BookingStatus.PENDING_APPROVAL,
          expiresAt: null,
        },
        include: BOOKING_INCLUDE,
      });
    });

    await this.notifications
      .send({
        userId: booking.customerId,
        kind: NotificationKind.BOOKING,
        title: `Booking ${booking.ref} rescheduled`,
        body: `New time: ${startsAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Awaiting vendor confirmation.`,
        href: `/customer/bookings/${booking.id}`,
        channels: [NotificationChannel.IN_APP],
      })
      .catch(() => undefined);

    return serializeBooking(updated);
  }

  async vendorUpdateStatus(user: AuthUser, id: string, dto: VendorBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: BOOKING_INCLUDE });
    if (!booking) throw new NotFoundException('Booking not found.');
    this.assertAccess(user, booking);

    const allowed: Record<string, BookingStatus[]> = {
      PENDING_APPROVAL: ['CONFIRMED', 'REJECTED'],
      CONFIRMED: ['IN_PROGRESS', 'NO_SHOW', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED'],
      CANCELLATION_REQUESTED: ['CANCELLED', 'CONFIRMED'],
    };
    if (!allowed[booking.status]?.includes(dto.status as BookingStatus)) {
      throw new BadRequestException(`Cannot change a ${booking.status.toLowerCase()} booking to ${dto.status.toLowerCase()}.`);
    }

    if (dto.status === 'COMPLETED') {
      return this.completeBooking(id, booking.vendorId);
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: dto.status as BookingStatus,
        ...(dto.status === 'CONFIRMED' ? { confirmedAt: new Date() } : {}),
        ...(dto.status === 'CANCELLED' ? { cancelledAt: new Date(), cancellationReason: dto.reason } : {}),
      },
      include: BOOKING_INCLUDE,
    });

    await this.notifications
      .send({
        userId: booking.customerId,
        kind: NotificationKind.BOOKING,
        title: `Booking ${booking.ref} ${dto.status === 'CONFIRMED' ? 'confirmed' : dto.status.toLowerCase()}`,
        body:
          dto.status === 'CONFIRMED'
            ? `${booking.vendor.name} confirmed your ${booking.service.name} on ${booking.startsAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`
            : `Status updated to ${dto.status.toLowerCase().replace('_', ' ')}.`,
        href: `/customer/bookings/${booking.id}`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        email: booking.customer.email,
      })
      .catch(() => undefined);

    return serializeBooking(updated);
  }

  private async completeBooking(id: string, vendorId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } });
      if (!booking) throw new NotFoundException('Booking not found.');

      const result = await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
          paymentStatus: booking.paymentStatus === PaymentStatus.PAID ? PaymentStatus.PAID : PaymentStatus.PAID,
        },
        include: BOOKING_INCLUDE,
      });

      const fee = booking.platformFeePaise;
      const vendorShare = booking.totalPaise - fee;

      await tx.ledgerEntry.createMany({
        data: [
          {
            vendorId,
            bookingId: booking.id,
            type: TransactionType.PAYOUT,
            amountPaise: vendorShare,
            description: `Earning for ${booking.ref}`,
          },
          {
            vendorId: null,
            bookingId: booking.id,
            type: TransactionType.COMMISSION,
            amountPaise: fee,
            description: `Platform commission for ${booking.ref}`,
          },
        ],
      });
      await tx.vendor.update({ where: { id: vendorId }, data: { jobsDone: { increment: 1 } } });
      await tx.service.update({ where: { id: booking.serviceId }, data: { bookingsCount: { increment: 1 } } });

      return result;
    });

    await this.notifications
      .send({
        userId: updated.customerId,
        kind: NotificationKind.REVIEW,
        title: `How was your ${updated.service.name}?`,
        body: 'Leave a verified review and help the next customer choose confidently.',
        href: `/customer/reviews?booking=${updated.id}`,
        channels: [NotificationChannel.IN_APP],
      })
      .catch(() => undefined);

    return serializeBooking(updated);
  }

  async markPaid(bookingId: string, method: PaymentMethod) {
    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: method,
        confirmedAt: new Date(),
        expiresAt: null,
      },
      include: BOOKING_INCLUDE,
    });
    await this.notifications
      .send({
        userId: booking.customerId,
        kind: NotificationKind.PAYMENT,
        title: `Payment received — ${booking.ref}`,
        body: `₹${(booking.totalPaise / 100).toLocaleString('en-IN')} paid. Your booking is confirmed.`,
        href: `/customer/bookings/${booking.id}`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
        email: booking.customer.email,
        phone: booking.customer.phone ?? undefined,
      })
      .catch(() => undefined);
    return serializeBooking(booking);
  }

  async stats(user: AuthUser) {
    const scope: Prisma.BookingWhereInput =
      user.role === 'CUSTOMER'
        ? { customerId: user.id }
        : user.role === 'VENDOR'
          ? { vendorId: user.vendorId ?? '__none__' }
          : {};
    const now = new Date();
    const [total, upcoming, completed, cancelled, revenue] = await this.prisma.$transaction([
      this.prisma.booking.count({ where: scope }),
      this.prisma.booking.count({ where: { ...scope, status: { in: ACTIVE_STATUSES } } }),
      this.prisma.booking.count({ where: { ...scope, status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { ...scope, status: { in: ['CANCELLED', 'REFUNDED'] } } }),
      this.prisma.booking.aggregate({
        where: { ...scope, paymentStatus: 'PAID', status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        _sum: { totalPaise: true },
      }),
    ]);
    const today = await this.prisma.booking.count({
      where: {
        ...scope,
        startsAt: { gte: new Date(now.setHours(0, 0, 0, 0)), lt: new Date(now.setHours(24, 0, 0, 0)) },
      },
    });
    return { total, upcoming, completed, cancelled, today, revenuePaise: revenue._sum.totalPaise ?? 0 };
  }

  private assertAccess(
    user: AuthUser,
    booking: { customerId: string; vendorId: string },
  ) {
    if (user.role === 'ADMIN') return;
    if (user.role === 'CUSTOMER' && booking.customerId === user.id) return;
    if (user.role === 'VENDOR' && booking.vendorId === user.vendorId) return;
    throw new ForbiddenException('You do not have access to this booking.');
  }
}

/* ------------------------------- serializer -------------------------------- */

export function serializeBooking(booking: any) {
  if (!booking) return booking;
  const paise = (value: number | null | undefined) => value ?? 0;
  return {
    ...booking,
    amountPaise: paise(booking.amountPaise),
    addOnsPaise: paise(booking.addOnsPaise),
    discountPaise: paise(booking.discountPaise),
    platformFeePaise: paise(booking.platformFeePaise),
    taxPaise: paise(booking.taxPaise),
    totalPaise: paise(booking.totalPaise),
    amount: paise(booking.totalPaise) / 100,
    service: booking.service
      ? { ...booking.service, price: paise(booking.service.pricePaise) / 100 }
      : booking.service,
    vendor: booking.vendor ? { ...booking.vendor, rating: Number(booking.vendor.rating ?? 0) } : booking.vendor,
    refunds: booking.refunds?.map((refund: any) => ({ ...refund, amount: refund.amountPaise / 100 })),
  };
}
