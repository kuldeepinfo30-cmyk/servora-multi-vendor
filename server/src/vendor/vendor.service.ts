import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  Prisma,
  ServiceStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/utils/refs';
import { paginated, PaginationDto, skipTake } from '../common/dto/pagination.dto';
import {
  AvailabilityRuleDto,
  CreateServiceDto,
  CreateStaffDto,
  ReplaceAvailabilityDto,
  TimeOffDto,
  UpdateServiceDto,
  UpdateVendorProfileDto,
} from './dto/vendor.dto';

@Injectable()
export class VendorService {
  constructor(private readonly prisma: PrismaService) {}

  private vendorId(value?: string | null): string {
    if (!value) throw new ForbiddenException('Complete your vendor onboarding first.');
    return value;
  }

  async me(vendorIdValue?: string | null) {
    const vendorId = this.vendorId(vendorIdValue);
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        category: { select: { id: true, name: true, slug: true, tone: true } },
        staff: {
          orderBy: { createdAt: 'asc' },
          include: { services: { select: { serviceId: true } } },
        },
        services: {
          orderBy: { createdAt: 'desc' },
          include: {
            category: { select: { id: true, name: true } },
            addOns: true,
            questions: true,
            _count: { select: { bookings: true, reviews: true } },
          },
        },
        _count: { select: { bookings: true, reviews: true, payouts: true } },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor profile not found.');
    return serializeVendorProfile(vendor);
  }

  async updateProfile(vendorIdValue: string | null | undefined, dto: UpdateVendorProfileDto) {
    const vendorId = this.vendorId(vendorIdValue);
    const { hours, policies, socials, ...rest } = dto;
    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...rest,
        ...(hours ? { hours: hours as Prisma.InputJsonValue } : {}),
        ...(policies ? { policies: policies as Prisma.InputJsonValue } : {}),
        ...(socials ? { socials: socials as Prisma.InputJsonValue } : {}),
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    return serializeVendorProfile(updated);
  }

  // --------------------------------- Services --------------------------------

  async services(vendorIdValue: string | null | undefined, query: PaginationDto & { status?: string }) {
    const vendorId = this.vendorId(vendorIdValue);
    const where: Prisma.ServiceWhereInput = {
      vendorId,
      ...(query.status ? { status: query.status as ServiceStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
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
          category: { select: { id: true, name: true } },
          addOns: true,
          questions: true,
          _count: { select: { bookings: true, reviews: true } },
        },
      }),
      this.prisma.service.count({ where }),
    ]);
    return paginated(data.map(serializeVendorService), total, query.page, query.pageSize);
  }

  async service(vendorIdValue: string | null | undefined, id: string) {
    const vendorId = this.vendorId(vendorIdValue);
    const service = await this.prisma.service.findFirst({
      where: { id, vendorId },
      include: { addOns: true, questions: true, category: true, _count: { select: { bookings: true, reviews: true } } },
    });
    if (!service) throw new NotFoundException('Service not found.');
    return serializeVendorService(service);
  }

  async createService(vendorIdValue: string | null | undefined, dto: CreateServiceDto) {
    const vendorId = this.vendorId(vendorIdValue);
    await this.assertCategory(dto.categoryId);
    const base = slugify(dto.name);
    const exists = await this.prisma.service.findUnique({ where: { slug: base } });
    const slug = exists ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;

    const service = await this.prisma.service.create({
      data: {
        vendorId,
        categoryId: dto.categoryId,
        slug,
        name: dto.name,
        description: dto.description,
        pricePaise: dto.pricePaise,
        durationMin: dto.durationMin,
        priceType: dto.priceType ?? 'FIXED',
        imageUrl: dto.imageUrl,
        tags: dto.tags ?? [],
        includes: dto.includes ?? [],
        status: dto.status ?? ServiceStatus.DRAFT,
        noticeHours: dto.noticeHours ?? 4,
        maxAdvanceDays: dto.maxAdvanceDays ?? 60,
        cancellationPolicy: dto.cancellationPolicy ?? 'Flexible',
        serviceAt: dto.serviceAt ?? 'Customer location',
        availableToday: dto.availableToday ?? true,
        discountPercent: dto.discountPercent ?? 0,
        bufferBeforeMin: dto.bufferBeforeMin ?? 0,
        bufferAfterMin: dto.bufferAfterMin ?? 15,
        addOns: dto.addOns?.length
          ? { create: dto.addOns.map((addOn, index) => ({ ...addOn, sortOrder: index })) }
          : undefined,
        questions: dto.questions?.length
          ? {
              create: dto.questions.map((question, index) => ({
                label: question.label,
                type: question.type,
                options: question.options ?? [],
                required: question.required ?? false,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: { addOns: true, questions: true, category: true },
    });
    return serializeVendorService(service);
  }

  async updateService(vendorIdValue: string | null | undefined, id: string, dto: UpdateServiceDto) {
    const vendorId = this.vendorId(vendorIdValue);
    const existing = await this.prisma.service.findFirst({ where: { id, vendorId } });
    if (!existing) throw new NotFoundException('Service not found.');
    if (dto.categoryId) await this.assertCategory(dto.categoryId);

    const service = await this.prisma.$transaction(async (tx) => {
      if (dto.addOns) {
        await tx.serviceAddOn.deleteMany({ where: { serviceId: id } });
        if (dto.addOns.length) {
          await tx.serviceAddOn.createMany({
            data: dto.addOns.map((addOn, index) => ({ ...addOn, serviceId: id, sortOrder: index })),
          });
        }
      }
      if (dto.questions) {
        await tx.serviceQuestion.deleteMany({ where: { serviceId: id } });
        if (dto.questions.length) {
          await tx.serviceQuestion.createMany({
            data: dto.questions.map((question, index) => ({
              serviceId: id,
              label: question.label,
              type: question.type,
              options: question.options ?? [],
              required: question.required ?? false,
              sortOrder: index,
            })),
          });
        }
      }
      return tx.service.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.pricePaise !== undefined ? { pricePaise: dto.pricePaise } : {}),
          ...(dto.durationMin !== undefined ? { durationMin: dto.durationMin } : {}),
          ...(dto.priceType !== undefined ? { priceType: dto.priceType } : {}),
          ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
          ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
          ...(dto.includes !== undefined ? { includes: dto.includes } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.noticeHours !== undefined ? { noticeHours: dto.noticeHours } : {}),
          ...(dto.maxAdvanceDays !== undefined ? { maxAdvanceDays: dto.maxAdvanceDays } : {}),
          ...(dto.cancellationPolicy !== undefined ? { cancellationPolicy: dto.cancellationPolicy } : {}),
          ...(dto.serviceAt !== undefined ? { serviceAt: dto.serviceAt } : {}),
          ...(dto.availableToday !== undefined ? { availableToday: dto.availableToday } : {}),
          ...(dto.discountPercent !== undefined ? { discountPercent: dto.discountPercent } : {}),
          ...(dto.bufferBeforeMin !== undefined ? { bufferBeforeMin: dto.bufferBeforeMin } : {}),
          ...(dto.bufferAfterMin !== undefined ? { bufferAfterMin: dto.bufferAfterMin } : {}),
        },
        include: { addOns: true, questions: true, category: true },
      });
    });
    return serializeVendorService(service);
  }

  async archiveService(vendorIdValue: string | null | undefined, id: string) {
    const vendorId = this.vendorId(vendorIdValue);
    const service = await this.prisma.service.findFirst({ where: { id, vendorId } });
    if (!service) throw new NotFoundException('Service not found.');
    const upcoming = await this.prisma.booking.count({
      where: {
        serviceId: id,
        status: { in: ['CONFIRMED', 'PENDING_APPROVAL', 'IN_PROGRESS'] },
        startsAt: { gt: new Date() },
      },
    });
    if (upcoming) throw new BadRequestException(`${upcoming} upcoming booking(s) still reference this service.`);
    await this.prisma.service.update({ where: { id }, data: { status: ServiceStatus.ARCHIVED } });
    return { archived: true };
  }

  private async assertCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new BadRequestException('Choose a valid category.');
  }

  // ---------------------------------- Staff ----------------------------------

  async staff(vendorIdValue: string | null | undefined) {
    const vendorId = this.vendorId(vendorIdValue);
    const rows = await this.prisma.vendorStaff.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'asc' },
      include: { services: { include: { service: { select: { id: true, name: true } } } } },
    });
    return rows.map((row) => ({
      ...row,
      rating: Number(row.rating),
      commissionRate: Number(row.commissionRate),
      serviceIds: row.services.map((link) => link.serviceId),
      services: row.services.map((link) => link.service),
    }));
  }

  async createStaff(vendorIdValue: string | null | undefined, dto: CreateStaffDto) {
    const vendorId = this.vendorId(vendorIdValue);
    const serviceIds = await this.validServiceIds(vendorId, dto.serviceIds);
    const staff = await this.prisma.vendorStaff.create({
      data: {
        vendorId,
        name: dto.name,
        role: dto.role,
        email: dto.email,
        phone: dto.phone,
        avatarUrl: dto.avatarUrl,
        commissionRate: dto.commissionRate ?? 0,
        experience: dto.experience,
        status: dto.status ?? 'active',
        services: { create: serviceIds.map((serviceId) => ({ serviceId })) },
      },
      include: { services: true },
    });
    return { ...staff, rating: Number(staff.rating), serviceIds };
  }

  async updateStaff(vendorIdValue: string | null | undefined, id: string, dto: CreateStaffDto) {
    const vendorId = this.vendorId(vendorIdValue);
    const existing = await this.prisma.vendorStaff.findFirst({ where: { id, vendorId } });
    if (!existing) throw new NotFoundException('Team member not found.');
    const serviceIds = await this.validServiceIds(vendorId, dto.serviceIds);

    const staff = await this.prisma.$transaction(async (tx) => {
      if (dto.serviceIds) {
        await tx.staffService.deleteMany({ where: { staffId: id } });
        if (serviceIds.length) {
          await tx.staffService.createMany({ data: serviceIds.map((serviceId) => ({ staffId: id, serviceId })) });
        }
      }
      return tx.vendorStaff.update({
        where: { id },
        data: {
          name: dto.name,
          role: dto.role,
          email: dto.email,
          phone: dto.phone,
          avatarUrl: dto.avatarUrl,
          commissionRate: dto.commissionRate,
          experience: dto.experience,
          status: dto.status,
        },
        include: { services: true },
      });
    });
    return { ...staff, rating: Number(staff.rating), serviceIds: staff.services.map((link) => link.serviceId) };
  }

  async removeStaff(vendorIdValue: string | null | undefined, id: string) {
    const vendorId = this.vendorId(vendorIdValue);
    const existing = await this.prisma.vendorStaff.findFirst({ where: { id, vendorId } });
    if (!existing) throw new NotFoundException('Team member not found.');
    const upcoming = await this.prisma.booking.count({
      where: { staffId: id, status: { in: ['CONFIRMED', 'PENDING_APPROVAL', 'IN_PROGRESS'] }, startsAt: { gt: new Date() } },
    });
    if (upcoming) {
      await this.prisma.vendorStaff.update({ where: { id }, data: { status: 'inactive' } });
      return { deactivated: true, upcoming };
    }
    await this.prisma.vendorStaff.delete({ where: { id } });
    return { deleted: true };
  }

  private async validServiceIds(vendorId: string, ids?: string[]) {
    if (!ids?.length) return [];
    const services = await this.prisma.service.findMany({ where: { id: { in: ids }, vendorId }, select: { id: true } });
    if (services.length !== ids.length) throw new BadRequestException('One or more services are invalid.');
    return services.map((service) => service.id);
  }

  // ------------------------------- Availability ------------------------------

  async availability(vendorIdValue: string | null | undefined) {
    const vendorId = this.vendorId(vendorIdValue);
    const rules = await this.prisma.availabilityRule.findMany({
      where: { vendorId },
      orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
    });
    const staff = await this.prisma.vendorStaff.findMany({
      where: { vendorId, status: 'active' },
      select: { id: true, name: true, role: true },
    });
    return { rules, staff };
  }

  async replaceAvailability(vendorIdValue: string | null | undefined, dto: ReplaceAvailabilityDto) {
    const vendorId = this.vendorId(vendorIdValue);
    if (dto.rules.length > 80) throw new BadRequestException('Too many availability rules.');
    for (const rule of dto.rules) {
      if (rule.startMinute >= rule.endMinute) {
        throw new BadRequestException('Each rule must end after it starts.');
      }
    }
    const staffIds = new Set((await this.staff(vendorId)).map((member) => member.id));
    for (const rule of dto.rules) {
      if (rule.staffId && !staffIds.has(rule.staffId)) {
        throw new BadRequestException('One of the rules references an unknown team member.');
      }
    }

    const rules = await this.prisma.$transaction(async (tx) => {
      await tx.availabilityRule.deleteMany({ where: { vendorId } });
      if (dto.rules.length) {
        await tx.availabilityRule.createMany({
          data: dto.rules.map((rule) => ({
            vendorId,
            staffId: rule.staffId,
            weekday: rule.weekday,
            startMinute: rule.startMinute,
            endMinute: rule.endMinute,
            slotIntervalMin: rule.slotIntervalMin ?? 30,
          })),
        });
      }
      return tx.availabilityRule.findMany({ where: { vendorId }, orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] });
    });
    return { rules };
  }

  async timeOff(vendorIdValue: string | null | undefined) {
    const vendorId = this.vendorId(vendorIdValue);
    return this.prisma.timeOff.findMany({
      where: { vendorId, endsAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { startsAt: 'asc' },
      include: { staff: { select: { id: true, name: true } } },
    });
  }

  async addTimeOff(vendorIdValue: string | null | undefined, dto: TimeOffDto) {
    const vendorId = this.vendorId(vendorIdValue);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw new BadRequestException('Enter a valid time-off window.');
    }
    if (dto.staffId) {
      const staff = await this.prisma.vendorStaff.findFirst({ where: { id: dto.staffId, vendorId } });
      if (!staff) throw new BadRequestException('Unknown team member.');
    }
    return this.prisma.timeOff.create({
      data: { vendorId, staffId: dto.staffId, startsAt, endsAt, reason: dto.reason },
    });
  }

  async removeTimeOff(vendorIdValue: string | null | undefined, id: string) {
    const vendorId = this.vendorId(vendorIdValue);
    const existing = await this.prisma.timeOff.findFirst({ where: { id, vendorId } });
    if (!existing) throw new NotFoundException('Time off not found.');
    await this.prisma.timeOff.delete({ where: { id } });
    return { deleted: true };
  }

  // -------------------------------- Customers --------------------------------

  async customers(vendorIdValue: string | null | undefined, query: PaginationDto) {
    const vendorId = this.vendorId(vendorIdValue);
    const bookings = await this.prisma.booking.findMany({
      where: { vendorId, status: { notIn: ['CANCELLED', 'EXPIRED', 'REJECTED'] } },
      include: { customer: { select: { id: true, name: true, email: true, phone: true, city: true, createdAt: true } } },
      orderBy: { startsAt: 'desc' },
    });
    const map = new Map<string, {
      customer: { id: string; name: string; email: string; phone: string | null; city: string | null; createdAt: Date };
      bookings: number;
      completed: number;
      spendPaise: number;
      lastBooking: Date;
    }>();
    for (const booking of bookings) {
      const entry = map.get(booking.customerId) ?? {
        customer: booking.customer,
        bookings: 0,
        completed: 0,
        spendPaise: 0,
        lastBooking: booking.startsAt,
      };
      entry.bookings += 1;
      if (booking.status === 'COMPLETED') {
        entry.completed += 1;
        entry.spendPaise += booking.totalPaise;
      }
      if (booking.startsAt > entry.lastBooking) entry.lastBooking = booking.startsAt;
      map.set(booking.customerId, entry);
    }
    let rows = Array.from(map.values());
    if (query.search) {
      const term = query.search.toLowerCase();
      rows = rows.filter(
        (row) =>
          row.customer.name.toLowerCase().includes(term) ||
          row.customer.email.toLowerCase().includes(term) ||
          (row.customer.phone ?? '').includes(term),
      );
    }
    rows.sort((a, b) => b.lastBooking.getTime() - a.lastBooking.getTime());
    const total = rows.length;
    const start = ((query.page ?? 1) - 1) * (query.pageSize ?? 20);
    return paginated(rows.slice(start, start + (query.pageSize ?? 20)), total, query.page, query.pageSize);
  }

  // -------------------------------- Dashboard --------------------------------

  async dashboard(vendorIdValue: string | null | undefined, userId: string) {
    const vendorId = this.vendorId(vendorIdValue);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      vendor,
      todayCount,
      pendingCount,
      upcoming,
      completed,
      revenue,
      pendingPayout,
      unread,
      recentBookings,
      topServices,
      unanswered,
      weekBookings,
    ] = await this.prisma.$transaction([
      this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { rating: true, reviewCount: true, jobsDone: true, status: true, name: true } }),
      this.prisma.booking.count({ where: { vendorId, startsAt: { gte: startOfDay, lt: endOfDay } } }),
      this.prisma.booking.count({ where: { vendorId, status: 'PENDING_APPROVAL' } }),
      this.prisma.booking.count({ where: { vendorId, status: { in: ['CONFIRMED', 'PENDING_APPROVAL', 'IN_PROGRESS'] }, startsAt: { gte: startOfDay } } }),
      this.prisma.booking.count({ where: { vendorId, status: 'COMPLETED' } }),
      this.prisma.booking.aggregate({ where: { vendorId, status: 'COMPLETED', paymentStatus: 'PAID' }, _sum: { totalPaise: true } }),
      this.prisma.payout.aggregate({ where: { vendorId, status: { in: ['REQUESTED', 'APPROVED', 'PROCESSING'] } }, _sum: { amountPaise: true } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
      this.prisma.booking.findMany({
        where: { vendorId },
        orderBy: { startsAt: 'desc' },
        take: 6,
        include: {
          customer: { select: { name: true, avatarUrl: true } },
          service: { select: { name: true, imageUrl: true } },
        },
      }),
      this.prisma.service.findMany({
        where: { vendorId, status: 'PUBLISHED' },
        orderBy: { bookingsCount: 'desc' },
        take: 4,
        select: { id: true, name: true, bookingsCount: true, rating: true, pricePaise: true },
      }),
      this.prisma.review.count({ where: { vendorId, vendorReply: null, status: 'PUBLISHED' } }),
      this.prisma.booking.findMany({
        where: { vendorId, startsAt: { gte: weekAgo } },
        select: { startsAt: true, totalPaise: true, status: true },
      }),
    ]);

    const series = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(startOfDay.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
      const key = day.toISOString().slice(0, 10);
      const dayBookings = weekBookings.filter((booking) => booking.startsAt.toISOString().slice(0, 10) === key);
      return {
        date: key,
        bookings: dayBookings.length,
        revenuePaise: dayBookings.reduce((sum, booking) => sum + booking.totalPaise, 0),
      };
    });

    return {
      vendor: { ...vendor, rating: Number(vendor?.rating ?? 0) },
      kpis: {
        today: todayCount,
        pendingApproval: pendingCount,
        upcoming,
        completed,
        revenuePaise: revenue._sum.totalPaise ?? 0,
        pendingPayoutPaise: pendingPayout._sum.amountPaise ?? 0,
        unreadNotifications: unread,
        unansweredReviews: unanswered,
      },
      recentBookings,
      topServices: topServices.map((service) => ({ ...service, rating: Number(service.rating) })),
      week: series,
    };
  }
}

function serializeVendorService(service: any) {
  return {
    ...service,
    rating: Number(service.rating ?? 0),
    price: service.pricePaise / 100,
    addOns: (service.addOns ?? []).map((addOn: any) => ({ ...addOn, price: addOn.pricePaise / 100 })),
    bookingCount: service._count?.bookings ?? 0,
    reviewCount: service._count?.reviews ?? service.reviewCount ?? 0,
  };
}

function serializeVendorProfile(vendor: any) {
  return {
    ...vendor,
    rating: Number(vendor.rating ?? 0),
    commissionRate: Number(vendor.commissionRate ?? 0),
    staff: vendor.staff?.map((member: any) => ({
      ...member,
      rating: Number(member.rating ?? 0),
      serviceIds: member.services?.map((link: any) => link.serviceId) ?? [],
    })),
    services: vendor.services?.map(serializeVendorService),
  };
}
