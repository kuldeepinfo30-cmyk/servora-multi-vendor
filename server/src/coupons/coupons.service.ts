import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponStatus, CouponType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { applyPercent } from '../common/utils/money';
import { paginated, PaginationDto, skipTake } from '../common/dto/pagination.dto';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';

type Db = PrismaService | Prisma.TransactionClient;

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async active() {
    return this.prisma.coupon.findMany({
      where: {
        status: CouponStatus.ACTIVE,
        startsAt: { lte: new Date() },
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async validate(dto: ValidateCouponDto, userId: string, db: Db = this.prisma) {
    const coupon = await db.coupon.findUnique({ where: { code: dto.code.trim().toUpperCase() } });
    if (!coupon) throw new BadRequestException('That coupon code does not exist.');
    if (coupon.status !== CouponStatus.ACTIVE) throw new BadRequestException('This coupon is not active.');
    const now = new Date();
    if (coupon.startsAt > now) throw new BadRequestException('This coupon is not live yet.');
    if (coupon.expiresAt <= now) throw new BadRequestException('This coupon has expired.');
    if (coupon.usedCount >= coupon.usageLimit) throw new BadRequestException('This coupon has reached its limit.');
    if (dto.amountPaise < coupon.minOrderPaise) {
      throw new BadRequestException(`Minimum order for this coupon is ₹${(coupon.minOrderPaise / 100).toLocaleString('en-IN')}.`);
    }
    if (coupon.scope !== 'all') {
      if (coupon.scope === 'vendor' && coupon.vendorId !== dto.vendorId) {
        throw new BadRequestException('This coupon is not valid for this vendor.');
      }
      if (coupon.scope === 'service' && coupon.vendorId && coupon.vendorId !== dto.vendorId) {
        throw new BadRequestException('This coupon is not valid for this service.');
      }
    }

    const usedByUser = await db.couponRedemption.count({ where: { couponId: coupon.id, userId } });
    if (usedByUser >= coupon.perUserLimit) {
      throw new BadRequestException('You have already used this coupon.');
    }

    const discountPaise =
      coupon.type === CouponType.PERCENT
        ? applyPercent(dto.amountPaise, coupon.value, coupon.maxDiscountPaise ?? undefined)
        : Math.min(coupon.value, dto.amountPaise);

    return { coupon, discountPaise, finalPaise: dto.amountPaise - discountPaise };
  }

  /** Called inside the booking transaction. */
  async redeem(
    tx: Prisma.TransactionClient,
    input: { couponId: string; userId: string; bookingId: string; discountPaise: number },
  ) {
    await tx.coupon.update({ where: { id: input.couponId }, data: { usedCount: { increment: 1 } } });
    await tx.couponRedemption.create({
      data: {
        couponId: input.couponId,
        userId: input.userId,
        bookingId: input.bookingId,
        discountPaise: input.discountPaise,
      },
    });
  }

  async list(query: PaginationDto & { status?: string }) {
    const where: Prisma.CouponWhereInput = {
      ...(query.status ? { status: query.status as CouponStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.coupon.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { _count: { select: { redemptions: true } } } }),
      this.prisma.coupon.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  create(dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        ...dto,
        code: dto.code.trim().toUpperCase(),
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        expiresAt: new Date(dto.expiresAt),
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Coupon not found.');
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.expiresAt ? { expiresAt: new Date(dto.expiresAt) } : {}),
      },
    });
  }

  async disable(id: string) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Coupon not found.');
    return this.prisma.coupon.update({ where: { id }, data: { status: CouponStatus.DISABLED } });
  }

  async stats() {
    const now = new Date();
    const [active, scheduled, redemptions, expired] = await this.prisma.$transaction([
      this.prisma.coupon.count({ where: { status: 'ACTIVE', expiresAt: { gt: now } } }),
      this.prisma.coupon.count({ where: { startsAt: { gt: now } } }),
      this.prisma.couponRedemption.aggregate({ _sum: { discountPaise: true }, _count: true }),
      this.prisma.coupon.count({ where: { expiresAt: { lte: now } } }),
    ]);
    return {
      active,
      scheduled,
      expired,
      redemptions: redemptions._count,
      discountGivenPaise: redemptions._sum.discountPaise ?? 0,
    };
  }
}
