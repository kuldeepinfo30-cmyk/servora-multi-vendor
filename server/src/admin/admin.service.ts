import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  BookingStatus,
  CmsStatus,
  NotificationChannel,
  NotificationKind,
  Prisma,
  Role,
  ServiceStatus,
  UserStatus,
  VendorStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { paginated, PaginationDto, skipTake } from '../common/dto/pagination.dto';
import { slugify } from '../common/utils/refs';
import {
  AdminQueryDto,
  ApplicationDecisionDto,
  CategoryDto,
  CmsPageDto,
  InviteAdminDto,
  ModerateServiceDto,
  UpdateCommissionDto,
  UpdateSettingsDto,
  UpdateUserStatusDto,
  UpdateVendorStatusDto,
} from './dto/admin.dto';

const DEFAULT_SETTINGS: Record<string, unknown> = {
  platformName: 'Servora',
  tagline: 'Local services, minus the hassle.',
  supportEmail: 'support@servora.in',
  supportPhone: '+91 80 4000 1234',
  commissionRate: 12.5,
  payoutCycle: 'weekly',
  minPayoutPaise: 50000,
  bookingHoldMinutes: 20,
  cancellationWindowHours: 24,
  gstNumber: '29AABCS1429B1ZX',
  maintenanceMode: false,
  autoApproveVendors: false,
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly payments: PaymentsService,
  ) {}

  // -------------------------------- Dashboard --------------------------------

  async dashboard() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);

    const [
      customers,
      vendors,
      pendingVendors,
      services,
      bookings,
      todayBookings,
      revenue,
      commission,
      openDisputes,
      pendingPayouts,
      pendingApplications,
      flaggedReviews,
      recentAudit,
      recentBookings,
      monthlyRows,
      categories,
      statusRows,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.vendor.count({ where: { status: VendorStatus.APPROVED } }),
      this.prisma.vendor.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
      this.prisma.service.count({ where: { status: ServiceStatus.PUBLISHED } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amountPaise: true } }),
      this.prisma.booking.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { platformFeePaise: true } }),
      this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      this.prisma.payout.aggregate({ where: { status: { in: ['REQUESTED', 'APPROVED', 'PROCESSING'] } }, _sum: { amountPaise: true }, _count: true }),
      this.prisma.vendorApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.review.count({ where: { status: 'FLAGGED' } }),
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
      this.prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          customer: { select: { name: true } },
          vendor: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),
      this.prisma.booking.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, totalPaise: true, platformFeePaise: true, status: true },
      }),
      this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { vendors: true, services: true } } },
      }),
      this.prisma.booking.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: true }),
    ]);

    const months: Array<{ month: string; revenuePaise: number; commissionPaise: number; bookings: number }> = [];
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - index, 1);
      const key = date.toISOString().slice(0, 7);
      const rows = monthlyRows.filter((row) => row.createdAt.toISOString().slice(0, 7) === key);
      months.push({
        month: key,
        revenuePaise: rows.reduce((sum, row) => sum + row.totalPaise, 0),
        commissionPaise: rows.reduce((sum, row) => sum + row.platformFeePaise, 0),
        bookings: rows.length,
      });
    }

    return {
      kpis: {
        customers,
        vendors,
        pendingVendors,
        services,
        bookings,
        todayBookings,
        gmvPaise: revenue._sum.amountPaise ?? 0,
        commissionPaise: commission._sum.platformFeePaise ?? 0,
        openDisputes,
        pendingPayoutPaise: pendingPayouts._sum.amountPaise ?? 0,
        pendingPayouts: pendingPayouts._count,
        pendingApplications,
        flaggedReviews,
      },
      months,
      funnel: statusRows.map((row) => ({ status: row.status, count: row._count })),
      recentBookings,
      recentAudit,
      categories: categories.map(({ _count, ...category }) => ({
        ...category,
        vendorCount: _count.vendors,
        serviceCount: _count.services,
      })),
    };
  }

  // --------------------------------- Customers -------------------------------

  async users(query: AdminQueryDto, role: Role = Role.CUSTOMER) {
    const where: Prisma.UserWhereInput = {
      role,
      ...(query.status ? { status: query.status as UserStatus } : {}),
      ...(query.city ? { city: { equals: query.city, mode: 'insensitive' } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [users, total, spend] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
      this.prisma.booking.groupBy({
        by: ['customerId'],
        where: { customerId: { in: (await this.prisma.user.findMany({ where, select: { id: true } })).map((user) => user.id) } },
        orderBy: { customerId: 'asc' },
        _sum: { totalPaise: true },
        _count: true,
      }),
    ]);
    const spendMap = new Map(spend.map((row) => [row.customerId, row]));
    return paginated(
      users.map((user) => {
        const stats = spendMap.get(user.id);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          city: user.city,
          status: user.status,
          joined: user.createdAt,
          bookings: stats?._count ?? 0,
          spendPaise: stats?._sum?.totalPaise ?? 0,
          emailVerified: Boolean(user.emailVerifiedAt),
        };
      }),
      total,
      query.page,
      query.pageSize,
    );
  }

  async userDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        bookings: {
          take: 10,
          orderBy: { startsAt: 'desc' },
          include: { service: { select: { name: true } }, vendor: { select: { name: true } } },
        },
        reviews: { take: 5, orderBy: { createdAt: 'desc' } },
        disputes: { orderBy: { createdAt: 'desc' } },
        _count: { select: { bookings: true, reviews: true, disputes: true } },
      },
    });
    if (!user) throw new NotFoundException('Customer not found.');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Customer not found.');
    const updated = await this.prisma.user.update({ where: { id }, data: { status: dto.status } });
    await this.notifications
      .send({
        userId: id,
        kind: NotificationKind.SYSTEM,
        title: `Account ${dto.status.toLowerCase()}`,
        body: dto.reason ?? `Your account status is now ${dto.status.toLowerCase()}.`,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        email: user.email,
      })
      .catch(() => undefined);
    const { passwordHash, ...safe } = updated;
    return safe;
  }

  // ---------------------------------- Vendors --------------------------------

  async vendors(query: AdminQueryDto) {
    const where: Prisma.VendorWhereInput = {
      ...(query.status ? { status: query.status as VendorStatus } : {}),
      ...(query.city ? { city: { equals: query.city, mode: 'insensitive' } } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { city: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, tone: true } },
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { services: true, bookings: true, reviews: true } },
        },
      }),
      this.prisma.vendor.count({ where }),
    ]);
    return paginated(
      data.map(({ _count, ...vendor }) => ({
        ...vendor,
        rating: Number(vendor.rating),
        commissionRate: Number(vendor.commissionRate),
        serviceCount: _count.services,
        bookingCount: _count.bookings,
        reviewCount: _count.reviews,
      })),
      total,
      query.page,
      query.pageSize,
    );
  }

  async vendorDetail(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        category: true,
        owner: { select: { id: true, name: true, email: true, phone: true } },
        services: { include: { addOns: true }, take: 20 },
        payouts: { take: 10, orderBy: { requestedAt: 'desc' } },
        _count: { select: { bookings: true, reviews: true, services: true } },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found.');
    return { ...vendor, rating: Number(vendor.rating), commissionRate: Number(vendor.commissionRate) };
  }

  async updateVendorStatus(id: string, dto: UpdateVendorStatusDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: { owner: { select: { id: true, email: true } } },
    });
    if (!vendor) throw new NotFoundException('Vendor not found.');
    const updated = await this.prisma.vendor.update({
      where: { id },
      data: { status: dto.status, ...(dto.status === 'APPROVED' ? { verified: true } : {}) },
    });
    await this.notifications
      .send({
        userId: vendor.ownerId,
        kind: NotificationKind.SYSTEM,
        title: `Vendor account ${dto.status.toLowerCase().replace('_', ' ')}`,
        body: dto.reason ?? `Your storefront status is now ${dto.status.toLowerCase().replace('_', ' ')}.`,
        href: '/vendor/dashboard',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        email: vendor.owner.email,
      })
      .catch(() => undefined);
    return { ...updated, rating: Number(updated.rating), commissionRate: Number(updated.commissionRate) };
  }

  async updateCommission(id: string, dto: UpdateCommissionDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found.');
    const updated = await this.prisma.vendor.update({
      where: { id },
      data: { commissionRate: new Prisma.Decimal(dto.commissionRate) },
    });
    return { ...updated, rating: Number(updated.rating), commissionRate: Number(updated.commissionRate) };
  }

  // -------------------------------- Applications -----------------------------

  async applications(query: AdminQueryDto) {
    const where: Prisma.VendorApplicationWhereInput = {
      ...(query.status ? { status: query.status as ApplicationStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { business: { contains: query.search, mode: 'insensitive' } },
              { ownerName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.vendorApplication.findMany({
        where,
        skip,
        take,
        orderBy: { submittedAt: 'desc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      this.prisma.vendorApplication.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async decideApplication(id: string, dto: ApplicationDecisionDto, adminId: string) {
    const application = await this.prisma.vendorApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found.');
    if (application.status === 'APPROVED') throw new BadRequestException('This application is already approved.');

    if (dto.status === 'UNDER_REVIEW') {
      return this.prisma.vendorApplication.update({
        where: { id },
        data: { status: ApplicationStatus.UNDER_REVIEW, notes: dto.notes, reviewedById: adminId, reviewedAt: new Date() },
      });
    }

    if (dto.status === 'REJECTED') {
      return this.prisma.vendorApplication.update({
        where: { id },
        data: { status: ApplicationStatus.REJECTED, notes: dto.notes, reviewedById: adminId, reviewedAt: new Date() },
      });
    }

    const categoryId =
      application.categoryId ??
      (await this.prisma.category.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }))?.id;
    if (!categoryId) throw new BadRequestException('Create a category before approving vendors.');

    const tempPassword = `Servora@${randomBytes(3).toString('hex')}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: application.email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email: application.email,
            name: application.ownerName,
            phone: application.phone,
            passwordHash,
            role: Role.VENDOR,
            city: application.city,
          },
        });
      }
      const existingVendor = await tx.vendor.findUnique({ where: { ownerId: user.id } });
      const vendor =
        existingVendor ??
        (await tx.vendor.create({
          data: {
            ownerId: user.id,
            slug: `${slugify(application.business)}-${randomBytes(2).toString('hex')}`,
            name: application.business,
            tagline: 'Verified local professional',
            description: `${application.business} serves customers across ${application.city}.`,
            categoryId,
            city: application.city,
            area: application.city,
            address: application.city,
            email: application.email,
            phone: application.phone,
            status: VendorStatus.APPROVED,
            verified: true,
          },
        }));
      await tx.vendorApplication.update({
        where: { id },
        data: { status: ApplicationStatus.APPROVED, notes: dto.notes, reviewedById: adminId, reviewedAt: new Date() },
      });
      return { vendor, user };
    });

    await this.notifications
      .send({
        userId: result.user.id,
        kind: NotificationKind.SYSTEM,
        title: 'Vendor application approved 🎉',
        body: 'Your storefront is live. Add services and availability to start receiving bookings.',
        href: '/vendor/dashboard',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        email: application.email,
      })
      .catch(() => undefined);

    return {
      approved: true,
      vendorId: result.vendor.id,
      ...(await this.isDemo() ? { tempPassword } : {}),
    };
  }

  private async isDemo() {
    return process.env.NODE_ENV !== 'production';
  }

  // --------------------------------- Services --------------------------------

  async services(query: AdminQueryDto) {
    const where: Prisma.ServiceWhereInput = {
      ...(query.status ? { status: query.status as ServiceStatus } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.city ? { vendor: { city: query.city } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { vendor: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          vendor: { select: { id: true, name: true, city: true, status: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { bookings: true, reviews: true } },
        },
      }),
      this.prisma.service.count({ where }),
    ]);
    return paginated(
      data.map((service) => ({
        ...service,
        rating: Number(service.rating),
        price: service.pricePaise / 100,
        bookingCount: service._count.bookings,
        reviewCount: service._count.reviews,
      })),
      total,
      query.page,
      query.pageSize,
    );
  }

  async moderateService(id: string, dto: ModerateServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { vendor: { select: { ownerId: true, name: true } } },
    });
    if (!service) throw new NotFoundException('Service not found.');
    const updated = await this.prisma.service.update({ where: { id }, data: { status: dto.status } });
    await this.notifications
      .send({
        userId: service.vendor.ownerId,
        kind: NotificationKind.SYSTEM,
        title: `Service ${dto.status.toLowerCase()}`,
        body: dto.reason ?? `“${service.name}” is now ${dto.status.toLowerCase()}.`,
        href: '/vendor/services',
        channels: [NotificationChannel.IN_APP],
      })
      .catch(() => undefined);
    return { ...updated, rating: Number(updated.rating) };
  }

  // -------------------------------- Categories -------------------------------

  async categories() {
    const rows = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { services: true, vendors: true } } },
    });
    return rows.map(({ _count, ...category }) => ({
      ...category,
      serviceCount: _count.services,
      vendorCount: _count.vendors,
    }));
  }

  async createCategory(dto: CategoryDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('A category with this name already exists.');
    return this.prisma.category.create({
      data: {
        slug,
        name: dto.name,
        short: dto.short,
        description: dto.description,
        icon: dto.icon,
        tone: dto.tone ?? 'brand',
        imageUrl: dto.imageUrl,
        fromPricePaise: dto.fromPricePaise ?? 0,
        subcategories: dto.subcategories ?? [],
        sortOrder: dto.sortOrder ?? 99,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCategory(id: string, dto: CategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found.');
    return this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.name ? { slug: slugify(dto.name) } : {}),
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { services: true, vendors: true } } },
    });
    if (!category) throw new NotFoundException('Category not found.');
    if (category._count.services || category._count.vendors) {
      await this.prisma.category.update({ where: { id }, data: { isActive: false } });
      return { deactivated: true };
    }
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }

  // ---------------------------------- Finance --------------------------------

  async transactions(query: PaginationDto & { status?: string }) {
    return this.payments.adminList(query);
  }

  async refunds(query: PaginationDto & { status?: string }) {
    const where: Prisma.RefundWhereInput = query.status ? { status: query.status as never } : {};
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.refund.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              ref: true,
              customer: { select: { name: true } },
              vendor: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.refund.count({ where }),
    ]);
    return paginated(data.map((refund) => ({ ...refund, amount: refund.amountPaise / 100 })), total, query.page, query.pageSize);
  }

  async commissions() {
    const [groups, bookingsCount, globalSetting] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['vendorId'],
        _sum: { platformFeePaise: true, totalPaise: true },
        _count: true,
      }),
      this.prisma.booking.count(),
      this.prisma.platformSetting.findUnique({ where: { key: 'commissionRate' } }),
    ]);
    const vendors = await this.prisma.vendor.findMany({
      where: { id: { in: groups.map((group) => group.vendorId) } },
      select: { id: true, name: true, category: { select: { name: true } }, commissionRate: true },
    });
    const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor]));
    return {
      globalRate: Number(globalSetting?.value ?? DEFAULT_SETTINGS.commissionRate),
      bookings: bookingsCount,
      totalCommissionPaise: groups.reduce((sum, group) => sum + (group._sum.platformFeePaise ?? 0), 0),
      vendors: groups
        .map((group) => {
          const vendor = vendorMap.get(group.vendorId);
          return {
            vendorId: group.vendorId,
            vendorName: vendor?.name ?? 'Unknown vendor',
            category: vendor?.category.name ?? '—',
            commissionRate: Number(vendor?.commissionRate ?? 0),
            bookings: group._count,
            gmvPaise: group._sum.totalPaise ?? 0,
            commissionPaise: group._sum.platformFeePaise ?? 0,
          };
        })
        .sort((a, b) => b.commissionPaise - a.commissionPaise),
    };
  }

  async reports(range = '30d') {
    const days = range === '90d' ? 90 : range === '7d' ? 7 : range === '365d' ? 365 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [bookings, newUsers, refunds, payments, topVendors, categories] = await Promise.all([
      this.prisma.booking.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, startsAt: true, totalPaise: true, platformFeePaise: true, status: true },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.refund.aggregate({ where: { createdAt: { gte: since }, status: 'SUCCESS' }, _sum: { amountPaise: true } }),
      this.prisma.payment.groupBy({ by: ['method'], where: { createdAt: { gte: since }, status: 'SUCCESS' }, _sum: { amountPaise: true }, _count: true }),
      this.prisma.booking.groupBy({
        by: ['vendorId'],
        where: { createdAt: { gte: since } },
        _sum: { totalPaise: true },
        _count: true,
        orderBy: { _sum: { totalPaise: 'desc' } },
        take: 8,
      }),
      this.prisma.category.findMany({
        include: { _count: { select: { services: true } } },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);
    const vendorRows = await this.prisma.vendor.findMany({
      where: { id: { in: topVendors.map((row) => row.vendorId) } },
      select: { id: true, name: true },
    });
    const vendorMap = new Map(vendorRows.map((vendor) => [vendor.id, vendor.name]));

    const daily = new Map<string, { bookings: number; revenuePaise: number; commissionPaise: number }>();
    for (const booking of bookings) {
      const key = booking.createdAt.toISOString().slice(0, 10);
      const bucket = daily.get(key) ?? { bookings: 0, revenuePaise: 0, commissionPaise: 0 };
      bucket.bookings += 1;
      bucket.revenuePaise += booking.totalPaise;
      bucket.commissionPaise += booking.platformFeePaise;
      daily.set(key, bucket);
    }

    return {
      range: `${days}d`,
      totals: {
        bookings: bookings.length,
        revenuePaise: bookings.reduce((sum, booking) => sum + booking.totalPaise, 0),
        commissionPaise: bookings.reduce((sum, booking) => sum + booking.platformFeePaise, 0),
        refundsPaise: refunds._sum.amountPaise ?? 0,
        newUsers,
        cancellationRate:
          bookings.length === 0
            ? 0
            : (bookings.filter((booking) => ['CANCELLED', 'REFUNDED', 'EXPIRED'].includes(booking.status)).length / bookings.length) * 100,
      },
      daily: Array.from(daily.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ date, ...value })),
      paymentMethods: payments.map((row) => ({
        method: row.method ?? 'UNKNOWN',
        amountPaise: row._sum.amountPaise ?? 0,
        count: row._count,
      })),
      topVendors: topVendors.map((row) => ({
        vendorId: row.vendorId,
        name: vendorMap.get(row.vendorId) ?? 'Unknown',
        bookings: row._count,
        gmvPaise: row._sum.totalPaise ?? 0,
      })),
      categories: categories.map(({ _count, ...category }) => ({
        ...category,
        serviceCount: _count.services,
      })),
    };
  }

  // ------------------------------------ CMS ----------------------------------

  async cms(query: AdminQueryDto) {
    const where: Prisma.CmsPageWhereInput = {
      ...(query.status ? { status: query.status as CmsStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.cmsPage.findMany({ where, skip, take, orderBy: { updatedAt: 'desc' } }),
      this.prisma.cmsPage.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async createCms(dto: CmsPageDto, authorId: string) {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.title);
    const existing = await this.prisma.cmsPage.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('A page with this slug already exists.');
    return this.prisma.cmsPage.create({
      data: {
        slug,
        title: dto.title,
        excerpt: dto.excerpt,
        body: dto.body,
        status: dto.status ?? CmsStatus.DRAFT,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        authorId,
        publishedAt: dto.status === CmsStatus.PUBLISHED ? new Date() : null,
      },
    });
  }

  async updateCms(id: string, dto: CmsPageDto) {
    const existing = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Page not found.');
    return this.prisma.cmsPage.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.slug ? { slug: slugify(dto.slug) } : {}),
        ...(dto.status === CmsStatus.PUBLISHED && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });
  }

  async deleteCms(id: string) {
    const existing = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Page not found.');
    await this.prisma.cmsPage.delete({ where: { id } });
    return { deleted: true };
  }

  // --------------------------------- Settings --------------------------------

  async settings() {
    const rows = await this.prisma.platformSetting.findMany();
    const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  async updateSettings(dto: UpdateSettingsDto, adminId: string) {
    const entries = Object.entries(dto.settings);
    if (!entries.length) return this.settings();
    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.platformSetting.upsert({
          where: { key },
          create: { key, value: value as Prisma.InputJsonValue, updatedById: adminId },
          update: { value: value as Prisma.InputJsonValue, updatedById: adminId },
        }),
      ),
    );
    return this.settings();
  }

  // ----------------------------------- Team ----------------------------------

  async team() {
    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    return {
      members: admins,
      roles: [
        { name: 'Super Admin', members: admins.length, description: 'Full marketplace control, including billing and roles.' },
        { name: 'Finance Admin', members: 0, description: 'Payouts, refunds, commissions and reconciliation.' },
        { name: 'Support Admin', members: 0, description: 'Bookings, disputes and customer conversations.' },
        { name: 'Content Manager', members: 0, description: 'CMS, categories and review moderation.' },
        { name: 'Analyst', members: 0, description: 'Read-only access to reports and audit exports.' },
      ],
      rolesCount: 5,
    };
  }

  async inviteAdmin(dto: InviteAdminDto, adminId: string) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('A user with this email already exists.');
    const tempPassword = `Servora@${randomBytes(3).toString('hex')}`;
    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name,
        role: Role.ADMIN,
        passwordHash: await bcrypt.hash(tempPassword, 10),
        emailVerifiedAt: new Date(),
      },
    });
    await this.notifications
      .send({
        userId: user.id,
        kind: NotificationKind.SYSTEM,
        title: 'You have been invited to the Servora admin console',
        body: `Sign in with ${email}. A one-time password has been sent to your inbox.`,
        href: '/login',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        email,
      })
      .catch(() => undefined);
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      invitedBy: adminId,
      ...(process.env.NODE_ENV !== 'production' ? { tempPassword } : {}),
    };
  }
}
