import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationChannel, NotificationKind, Prisma, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { paginated, skipTake } from '../common/dto/pagination.dto';
import { CreateReviewDto, ModerateReviewDto, ReplyReviewDto, ReviewQueryDto } from './dto/review.dto';

const REVIEW_INCLUDE = {
  customer: { select: { id: true, name: true, avatarUrl: true } },
  service: { select: { id: true, name: true, slug: true } },
  vendor: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ReviewInclude;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(customerId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { review: true, vendor: { select: { ownerId: true, name: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found.');
    if (booking.customerId !== customerId) throw new ForbiddenException('You can only review your own booking.');
    if (booking.status !== 'COMPLETED') throw new BadRequestException('You can review a service once it is completed.');
    if (booking.review) throw new BadRequestException('You have already reviewed this booking.');

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          bookingId: booking.id,
          vendorId: booking.vendorId,
          serviceId: booking.serviceId,
          customerId,
          rating: dto.rating,
          title: dto.title,
          text: dto.text,
          images: dto.images ?? [],
          status: ReviewStatus.PUBLISHED,
        },
        include: REVIEW_INCLUDE,
      });
      await recalcRatings(tx, booking.vendorId, booking.serviceId);
      return created;
    });

    await this.notifications
      .send({
        userId: booking.vendor.ownerId,
        kind: NotificationKind.REVIEW,
        title: `New ${dto.rating}★ review`,
        body: `${review.customer.name}: “${dto.title}”. Reply to build trust with future customers.`,
        href: '/vendor/reviews',
        channels: [NotificationChannel.IN_APP],
      })
      .catch(() => undefined);

    return review;
  }

  async listForVendor(vendorId: string, query: ReviewQueryDto) {
    const where: Prisma.ReviewWhereInput = {
      vendorId,
      status: query.status ?? ReviewStatus.PUBLISHED,
      ...(query.serviceId ? { serviceId: query.serviceId } : {}),
      ...(query.unanswered === 'true' ? { vendorReply: null } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { text: { contains: query.search, mode: 'insensitive' } },
              { customer: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total, distribution] = await this.prisma.$transaction([
      this.prisma.review.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: REVIEW_INCLUDE }),
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { vendorId, status: ReviewStatus.PUBLISHED },
        orderBy: { rating: 'desc' },
        _count: true,
      }),
    ]);
    return {
      ...paginated(data, total, query.page, query.pageSize),
      distribution: [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: distribution.find((row) => row.rating === rating)?._count ?? 0,
      })),
    };
  }

  async listMine(customerId: string, query: ReviewQueryDto) {
    const where: Prisma.ReviewWhereInput = { customerId };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: REVIEW_INCLUDE }),
      this.prisma.review.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async reply(user: { id: string; role: string; vendorId?: string | null }, reviewId: string, dto: ReplyReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found.');
    if (user.role !== 'ADMIN' && review.vendorId !== user.vendorId) {
      throw new ForbiddenException('You can only reply to reviews for your business.');
    }
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { vendorReply: dto.text, repliedAt: new Date() },
      include: REVIEW_INCLUDE,
    });
  }

  async adminList(query: ReviewQueryDto) {
    const where: Prisma.ReviewWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.vendorId ? { vendorId: query.vendorId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { text: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: REVIEW_INCLUDE }),
      this.prisma.review.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async moderate(reviewId: string, dto: ModerateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found.');
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.review.update({
        where: { id: reviewId },
        data: { status: dto.status },
        include: REVIEW_INCLUDE,
      });
      await recalcRatings(tx, review.vendorId, review.serviceId);
      return result;
    });
    return updated;
  }

  async stats() {
    const [total, published, flagged, hidden, average] = await this.prisma.$transaction([
      this.prisma.review.count(),
      this.prisma.review.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.review.count({ where: { status: 'FLAGGED' } }),
      this.prisma.review.count({ where: { status: 'HIDDEN' } }),
      this.prisma.review.aggregate({ where: { status: 'PUBLISHED' }, _avg: { rating: true } }),
    ]);
    return { total, published, flagged, hidden, averageRating: Number(average._avg.rating ?? 0) };
  }
}

/** Recompute denormalised vendor + service ratings after a review change. */
export async function recalcRatings(tx: Prisma.TransactionClient, vendorId: string, serviceId: string) {
  const [vendorAgg, serviceAgg] = await Promise.all([
    tx.review.aggregate({ where: { vendorId, status: ReviewStatus.PUBLISHED }, _avg: { rating: true }, _count: true }),
    tx.review.aggregate({ where: { serviceId, status: ReviewStatus.PUBLISHED }, _avg: { rating: true }, _count: true }),
  ]);
  await Promise.all([
    tx.vendor.update({
      where: { id: vendorId },
      data: {
        rating: new Prisma.Decimal((vendorAgg._avg.rating ?? 0).toFixed(2)),
        reviewCount: vendorAgg._count,
      },
    }),
    tx.service.update({
      where: { id: serviceId },
      data: {
        rating: new Prisma.Decimal((serviceAgg._avg.rating ?? 0).toFixed(2)),
        reviewCount: serviceAgg._count,
      },
    }),
  ]);
}
