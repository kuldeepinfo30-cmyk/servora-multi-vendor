import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ServiceStatus, VendorStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { paginated, skipTake } from '../common/dto/pagination.dto';
import { ServiceQueryDto, VendorQueryDto } from './dto/catalog.dto';

export const SERVICE_INCLUDE = {
  vendor: {
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      area: true,
      rating: true,
      reviewCount: true,
      verified: true,
      responseTimeMins: true,
      coverUrl: true,
    },
  },
  category: { select: { id: true, slug: true, name: true, tone: true } },
  addOns: { orderBy: { sortOrder: 'asc' as const } },
  questions: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.ServiceInclude;

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // --------------------------------- Categories ------------------------------

  async categories() {
    return this.redis.remember('catalog:categories', 120, async () => {
      const rows = await this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { vendors: { where: { status: VendorStatus.APPROVED } }, services: { where: { status: ServiceStatus.PUBLISHED } } } } },
      });
      return rows.map(({ _count, ...category }) => ({
        ...category,
        fromPricePaise: category.fromPricePaise,
        vendorCount: _count.vendors,
        serviceCount: _count.services,
      }));
    });
  }

  async category(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: { select: { vendors: { where: { status: 'APPROVED' } }, services: { where: { status: 'PUBLISHED' } } } },
        services: {
          where: { status: 'PUBLISHED', vendor: { status: 'APPROVED' } },
          orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
          take: 8,
          include: SERVICE_INCLUDE,
        },
      },
    });
    if (!category) throw new NotFoundException('Category not found.');
    const { _count, ...rest } = category;
    return { ...rest, vendorCount: _count.vendors, serviceCount: _count.services, services: rest.services.map(serializeService) };
  }

  // ---------------------------------- Vendors -------------------------------

  async vendors(query: VendorQueryDto) {
    const where: Prisma.VendorWhereInput = {
      status: VendorStatus.APPROVED,
      ...(query.city ? { city: { equals: query.city, mode: 'insensitive' } } : {}),
      ...(query.category
        ? { category: { OR: [{ slug: query.category }, { id: query.category }] } }
        : {}),
      ...(query.rating ? { rating: { gte: Number(query.rating) } } : {}),
      ...(query.verified === 'true' ? { verified: true } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { tagline: { contains: query.search, mode: 'insensitive' } },
              { area: { contains: query.search, mode: 'insensitive' } },
              { tags: { has: query.search } },
            ],
          }
        : {}),
    };
    const orderBy = this.vendorSort(query.sort);
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, slug: true, name: true, tone: true } },
          _count: { select: { services: { where: { status: 'PUBLISHED' } }, reviews: { where: { status: 'PUBLISHED' } } } },
        },
      }),
      this.prisma.vendor.count({ where }),
    ]);
    return paginated(
      rows.map(({ _count, ...vendor }) => serializeVendor(vendor, _count)),
      total,
      query.page,
      query.pageSize,
    );
  }

  private vendorSort(sort?: string): Prisma.VendorOrderByWithRelationInput[] {
    switch (sort) {
      case 'price_asc':
        return [{ priceFromPaise: 'asc' }];
      case 'price_desc':
        return [{ priceFromPaise: 'desc' }];
      case 'popular':
        return [{ jobsDone: 'desc' }];
      case 'newest':
        return [{ createdAt: 'desc' }];
      default:
        return [{ featured: 'desc' }, { rating: 'desc' }, { reviewCount: 'desc' }];
    }
  }

  async vendor(slug: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, slug: true, name: true, tone: true } },
        services: {
          where: { status: ServiceStatus.PUBLISHED },
          orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
          include: SERVICE_INCLUDE,
        },
        staff: {
          where: { status: 'active' },
          select: { id: true, name: true, role: true, rating: true, jobsCount: true, experience: true, avatarUrl: true },
        },
        reviews: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          take: 6,
          include: { customer: { select: { name: true, avatarUrl: true } } },
        },
        _count: { select: { reviews: { where: { status: 'PUBLISHED' } }, bookings: true } },
      },
    });
    if (!vendor || vendor.status === VendorStatus.SUSPENDED) throw new NotFoundException('Vendor not found.');
    const { _count, ...rest } = vendor;
    return {
      ...serializeVendor(rest, { services: rest.services.length, reviews: _count.reviews }),
      bookingCount: _count.bookings,
      services: rest.services.map(serializeService),
      staff: rest.staff.map((member) => ({ ...member, rating: Number(member.rating) })),
      reviews: rest.reviews.map((review) => ({
        ...review,
        customer: review.customer?.name ?? 'Verified customer',
        avatarUrl: review.customer?.avatarUrl,
      })),
    };
  }

  async vendorServices(slug: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { slug }, select: { id: true } });
    if (!vendor) throw new NotFoundException('Vendor not found.');
    const services = await this.prisma.service.findMany({
      where: { vendorId: vendor.id, status: 'PUBLISHED' },
      orderBy: { rating: 'desc' },
      include: SERVICE_INCLUDE,
    });
    return services.map(serializeService);
  }

  // ---------------------------------- Services ------------------------------

  async services(query: ServiceQueryDto) {
    const where: Prisma.ServiceWhereInput = {
      status: ServiceStatus.PUBLISHED,
      vendor: { status: VendorStatus.APPROVED, ...(query.city ? { city: { equals: query.city, mode: 'insensitive' } } : {}) },
      ...(query.category ? { category: { OR: [{ slug: query.category }, { id: query.category }] } } : {}),
      ...(query.vendor ? { vendor: { OR: [{ slug: query.vendor }, { id: query.vendor }] } } : {}),
      ...(query.featured === 'true' ? { featured: true } : {}),
      ...(query.rating ? { rating: { gte: Number(query.rating) } } : {}),
      ...(query.minPrice || query.maxPrice
        ? {
            pricePaise: {
              ...(query.minPrice ? { gte: Math.round(Number(query.minPrice) * 100) } : {}),
              ...(query.maxPrice ? { lte: Math.round(Number(query.maxPrice) * 100) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { tags: { has: query.search } },
              { vendor: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const sort: Prisma.ServiceOrderByWithRelationInput[] =
      query.sort === 'price_asc'
        ? [{ pricePaise: 'asc' }]
        : query.sort === 'price_desc'
          ? [{ pricePaise: 'desc' }]
          : query.sort === 'popular'
            ? [{ bookingsCount: 'desc' }]
            : query.sort === 'newest'
              ? [{ createdAt: 'desc' }]
              : [{ featured: 'desc' }, { rating: 'desc' }];
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({ where, skip, take, orderBy: sort, include: SERVICE_INCLUDE }),
      this.prisma.service.count({ where }),
    ]);
    return paginated(rows.map(serializeService), total, query.page, query.pageSize);
  }

  async service(slug: string) {
    const service = await this.prisma.service.findUnique({
      where: { slug },
      include: {
        ...SERVICE_INCLUDE,
        vendor: {
          include: {
            category: { select: { id: true, slug: true, name: true } },
            staff: { where: { status: 'active' }, select: { id: true, name: true, role: true, rating: true } },
          },
        },
        reviews: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          take: 6,
          include: { customer: { select: { name: true, avatarUrl: true } } },
        },
        staffLinks: { include: { staff: { select: { id: true, name: true, role: true, rating: true } } } },
      },
    });
    if (!service || service.status !== ServiceStatus.PUBLISHED) throw new NotFoundException('Service not found.');
    const { reviews, staffLinks, ...rest } = service;
    return {
      ...serializeService(rest as never),
      staff: staffLinks.map((link) => ({ ...link.staff, rating: Number(link.staff.rating ?? 0) })),
      reviews: reviews.map((review) => ({
        ...review,
        customer: review.customer?.name ?? 'Verified customer',
        avatarUrl: review.customer?.avatarUrl,
      })),
    };
  }

  async cities() {
    const rows = await this.prisma.vendor.findMany({
      where: { status: 'APPROVED' },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    return rows.map((row) => row.city);
  }
}

/* ------------------------------- serializers ------------------------------- */

export function serializeVendor<T extends Record<string, any>>(vendor: T, counts?: { services?: number; reviews?: number }) {
  return {
    ...vendor,
    rating: Number(vendor.rating ?? 0),
    commissionRate: Number(vendor.commissionRate ?? 0),
    lat: vendor.lat !== null && vendor.lat !== undefined ? Number(vendor.lat) : null,
    lng: vendor.lng !== null && vendor.lng !== undefined ? Number(vendor.lng) : null,
    priceFromPaise: vendor.priceFromPaise,
    servicesCount: counts?.services ?? vendor.services?.length ?? 0,
    reviewsCount: counts?.reviews ?? vendor.reviewCount ?? 0,
  };
}

export function serializeService(service: any) {
  return {
    ...service,
    rating: Number(service.rating ?? 0),
    pricePaise: service.pricePaise,
    price: service.pricePaise / 100,
    addOns: (service.addOns ?? []).map((addOn: any) => ({
      ...addOn,
      price: addOn.pricePaise / 100,
    })),
    vendor: service.vendor
      ? {
          ...service.vendor,
          rating: Number(service.vendor.rating ?? 0),
          priceFromPaise: service.vendor.priceFromPaise,
        }
      : undefined,
  };
}
