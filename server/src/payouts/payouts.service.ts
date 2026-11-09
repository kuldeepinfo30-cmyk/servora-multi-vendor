import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PayoutStatus, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel, NotificationKind } from '@prisma/client';
import { payoutRef } from '../common/utils/refs';
import { paginated, PaginationDto, skipTake } from '../common/dto/pagination.dto';
import { RequestPayoutDto, UpdatePayoutDto } from './dto/payout.dto';

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private assertVendor(vendorId?: string | null): string {
    if (!vendorId) throw new ForbiddenException('Complete vendor onboarding first.');
    return vendorId;
  }

  async earnings(userVendorId?: string | null) {
    const vendorId = this.assertVendor(userVendorId);
    const [entries, payouts, vendor] = await Promise.all([
      this.prisma.ledgerEntry.findMany({ where: { vendorId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.payout.findMany({ where: { vendorId }, orderBy: { requestedAt: 'desc' }, take: 24 }),
      this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { commissionRate: true, name: true } }),
    ]);

    const availablePaise = entries.reduce((sum, entry) => sum + entry.amountPaise, 0);
    const lifetimePaise = entries
      .filter((entry) => entry.type === TransactionType.PAYOUT && entry.amountPaise > 0)
      .reduce((sum, entry) => sum + entry.amountPaise, 0);
    const commissionPaise = entries
      .filter((entry) => entry.type === TransactionType.COMMISSION)
      .reduce((sum, entry) => sum + entry.amountPaise, 0);
    const refundedPaise = entries
      .filter((entry) => entry.type === TransactionType.REFUND)
      .reduce((sum, entry) => sum + Math.abs(entry.amountPaise), 0);
    const pendingPayoutPaise = payouts
      .filter((payout) => ['REQUESTED', 'APPROVED', 'PROCESSING'].includes(payout.status))
      .reduce((sum, payout) => sum + payout.amountPaise, 0);

    const buckets = new Map<string, { gross: number; commission: number; net: number }>();
    for (const entry of entries) {
      if (entry.type !== TransactionType.PAYOUT && entry.type !== TransactionType.COMMISSION) continue;
      const key = entry.createdAt.toISOString().slice(0, 7);
      const bucket = buckets.get(key) ?? { gross: 0, commission: 0, net: 0 };
      if (entry.type === TransactionType.COMMISSION) bucket.commission += entry.amountPaise;
      else if (entry.amountPaise > 0) bucket.net += entry.amountPaise;
      bucket.gross = bucket.net + bucket.commission;
      buckets.set(key, bucket);
    }

    return {
      availablePaise,
      lifetimePaise,
      commissionPaise,
      refundedPaise,
      pendingPayoutPaise,
      commissionRate: Number(vendor?.commissionRate ?? 0),
      vendorName: vendor?.name,
      monthly: Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, value]) => ({
          month,
          grossPaise: Math.round(value.gross),
          commissionPaise: value.commission,
          netPaise: value.net,
        })),
      recentEntries: entries.slice(-20).reverse(),
      payouts,
    };
  }

  async request(vendorId: string | null | undefined, dto: RequestPayoutDto) {
    const id = this.assertVendor(vendorId);
    const balance = await this.prisma.ledgerEntry.aggregate({ where: { vendorId: id }, _sum: { amountPaise: true } });
    const available = balance._sum.amountPaise ?? 0;
    if (dto.amountPaise > available) {
      throw new BadRequestException(`Only ₹${(available / 100).toLocaleString('en-IN')} is available right now.`);
    }

    const payout = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payout.create({
        data: {
          ref: payoutRef(),
          vendorId: id,
          amountPaise: dto.amountPaise,
          method: dto.method ?? 'IMPS',
          status: PayoutStatus.REQUESTED,
          periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          periodEnd: new Date(),
          bankSnapshot: { bank: 'HDFC Bank', account: '•••• 4821', ifsc: 'HDFC0001234' },
        },
      });
      await tx.ledgerEntry.create({
        data: {
          vendorId: id,
          type: TransactionType.PAYOUT,
          amountPaise: -dto.amountPaise,
          description: `Payout request ${created.ref}`,
        },
      });
      return created;
    });

    return payout;
  }

  async listVendor(vendorId: string | null | undefined, query: PaginationDto) {
    const id = this.assertVendor(vendorId);
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.payout.findMany({ where: { vendorId: id }, skip, take, orderBy: { requestedAt: 'desc' } }),
      this.prisma.payout.count({ where: { vendorId: id } }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async adminList(query: PaginationDto & { status?: string }) {
    const where: Prisma.PayoutWhereInput = {
      ...(query.status ? { status: query.status as PayoutStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { ref: { contains: query.search, mode: 'insensitive' } },
              { vendor: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total, pending] = await this.prisma.$transaction([
      this.prisma.payout.findMany({
        where,
        skip,
        take,
        orderBy: { requestedAt: 'desc' },
        include: { vendor: { select: { id: true, name: true, slug: true, email: true } } },
      }),
      this.prisma.payout.count({ where }),
      this.prisma.payout.aggregate({ where: { status: { in: ['REQUESTED', 'APPROVED', 'PROCESSING'] } }, _sum: { amountPaise: true }, _count: true }),
    ]);
    return {
      ...paginated(data, total, query.page, query.pageSize),
      pending: { count: pending._count, amountPaise: pending._sum.amountPaise ?? 0 },
    };
  }

  async updateStatus(id: string, dto: UpdatePayoutDto) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: { vendor: { select: { ownerId: true, name: true } } },
    });
    if (!payout) throw new NotFoundException('Payout not found.');
    if (payout.status === 'PAID' && dto.status !== 'PAID') {
      throw new BadRequestException('A paid payout cannot be changed.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.payout.update({
        where: { id },
        data: {
          status: dto.status as PayoutStatus,
          ...(dto.status === 'PAID' ? { processedAt: new Date() } : {}),
          ...(dto.failureReason ? { failureReason: dto.failureReason } : {}),
          ...(dto.reference ? { bankSnapshot: { ...(payout.bankSnapshot as object), reference: dto.reference } } : {}),
        },
      });

      if (dto.status === 'REJECTED' || dto.status === 'FAILED') {
        await tx.ledgerEntry.create({
          data: {
            vendorId: payout.vendorId,
            type: TransactionType.ADJUSTMENT,
            amountPaise: payout.amountPaise,
            description: `Payout ${payout.ref} ${dto.status.toLowerCase()} — funds returned`,
          },
        });
      }
      return result;
    });

    await this.notifications
      .send({
        userId: payout.vendor.ownerId,
        kind: NotificationKind.PAYMENT,
        title: `Payout ${payout.ref} ${dto.status.toLowerCase()}`,
        body:
          dto.status === 'PAID'
            ? `₹${(payout.amountPaise / 100).toLocaleString('en-IN')} has been transferred to your bank account.`
            : `Your payout status is now ${dto.status.toLowerCase()}.`,
        href: '/vendor/payouts',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      })
      .catch(() => undefined);

    return updated;
  }

  async stats() {
    const [pending, paid, requested, vendors] = await this.prisma.$transaction([
      this.prisma.payout.aggregate({ where: { status: { in: ['REQUESTED', 'APPROVED', 'PROCESSING'] } }, _sum: { amountPaise: true } }),
      this.prisma.payout.aggregate({ where: { status: 'PAID' }, _sum: { amountPaise: true }, _count: true }),
      this.prisma.payout.count({ where: { status: 'REQUESTED' } }),
      this.prisma.payout.groupBy({
        by: ['vendorId'],
        where: { status: 'PAID' },
        orderBy: { vendorId: 'asc' },
        _sum: { amountPaise: true },
      }),
    ]);
    return {
      pendingPaise: pending._sum.amountPaise ?? 0,
      paidPaise: paid._sum.amountPaise ?? 0,
      paidCount: paid._count,
      requested,
      vendorsPaid: vendors.length,
    };
  }
}
