import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  DisputePriority,
  DisputeStatus,
  NotificationChannel,
  NotificationKind,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { disputeRef } from '../common/utils/refs';
import { paginated, skipTake } from '../common/dto/pagination.dto';
import { CreateDisputeDto, DisputeQueryDto, ResolveDisputeDto } from './dto/dispute.dto';

const DISPUTE_INCLUDE = {
  booking: {
    select: {
      id: true,
      ref: true,
      totalPaise: true,
      startsAt: true,
      service: { select: { name: true } },
    },
  },
  customer: { select: { id: true, name: true, email: true } },
  vendor: { select: { id: true, name: true, slug: true, ownerId: true } },
  resolvedBy: { select: { id: true, name: true } },
} satisfies Prisma.DisputeInclude;

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(customerId: string, dto: CreateDisputeDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { dispute: true, vendor: { select: { name: true, ownerId: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.customerId !== customerId) throw new ForbiddenException('You can only dispute your own booking.');
    if (booking.dispute) throw new BadRequestException('A dispute already exists for this booking.');
    if (!['COMPLETED', 'CONFIRMED', 'IN_PROGRESS', 'DISPUTED'].includes(booking.status)) {
      throw new BadRequestException('This booking is not eligible for a dispute.');
    }

    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          ref: disputeRef(),
          bookingId: booking.id,
          customerId,
          vendorId: booking.vendorId,
          reason: dto.reason,
          description: dto.description,
          amountPaise: booking.totalPaise,
          priority: dto.priority ?? (booking.totalPaise >= 500000 ? DisputePriority.HIGH : DisputePriority.MEDIUM),
        },
        include: DISPUTE_INCLUDE,
      });
      await tx.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.DISPUTED } });
      return created;
    });

    await this.notifications
      .send({
        userId: booking.vendor.ownerId,
        kind: NotificationKind.SYSTEM,
        title: `Dispute opened — ${dispute.ref}`,
        body: `A customer raised an issue with ${booking.ref}: ${dto.reason}. Respond within 24 hours.`,
        href: '/vendor/bookings',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      })
      .catch(() => undefined);

    return dispute;
  }

  async listMine(customerId: string, query: DisputeQueryDto) {
    return this.list({ ...query, customerId });
  }

  async listVendor(vendorId: string, query: DisputeQueryDto) {
    return this.list({ ...query, vendorId });
  }

  async list(query: DisputeQueryDto & { customerId?: string; vendorId?: string }) {
    const where: Prisma.DisputeWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.vendorId ? { vendorId: query.vendorId } : {}),
      ...(query.search
        ? {
            OR: [
              { ref: { contains: query.search, mode: 'insensitive' } },
              { reason: { contains: query.search, mode: 'insensitive' } },
              { booking: { ref: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.dispute.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: DISPUTE_INCLUDE }),
      this.prisma.dispute.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async resolve(admin: { id: string; name: string }, id: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: { booking: true, customer: { select: { email: true } } },
    });
    if (!dispute) throw new NotFoundException('Dispute not found.');
    if (dispute.status === 'RESOLVED' || dispute.status === 'REJECTED') {
      throw new BadRequestException('This dispute is already closed.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.dispute.update({
        where: { id },
        data: {
          status: dto.status as DisputeStatus,
          resolution: dto.resolution,
          ...(dto.priority ? { priority: dto.priority } : {}),
          ...(dto.status === 'RESOLVED' || dto.status === 'REJECTED'
            ? { resolvedById: admin.id, resolvedAt: new Date() }
            : {}),
        },
        include: DISPUTE_INCLUDE,
      });
      if (dto.status === 'RESOLVED' || dto.status === 'REJECTED') {
        await tx.booking.update({
          where: { id: dispute.bookingId },
          data: { status: BookingStatus.COMPLETED },
        });
      }
      return result;
    });

    await this.notifications
      .send({
        userId: dispute.customerId,
        kind: NotificationKind.SYSTEM,
        title: `Dispute ${dispute.ref} ${dto.status === 'RESOLVED' ? 'resolved' : dto.status.toLowerCase().replace('_', ' ')}`,
        body: dto.resolution,
        href: `/customer/support`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        email: dispute.customer.email,
      })
      .catch(() => undefined);

    return updated;
  }

  async stats() {
    const [open, review, resolved, value] = await this.prisma.$transaction([
      this.prisma.dispute.count({ where: { status: 'OPEN' } }),
      this.prisma.dispute.count({ where: { status: 'UNDER_REVIEW' } }),
      this.prisma.dispute.count({ where: { status: 'RESOLVED' } }),
      this.prisma.dispute.aggregate({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } }, _sum: { amountPaise: true }, _count: true }),
    ]);
    return { open, underReview: review, resolved, valueAtRiskPaise: value._sum.amountPaise ?? 0, openCases: value._count };
  }
}
