import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddressDto, FavoriteDto, UpdateProfileDto } from './dto/user.dto';

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PENDING_APPROVAL,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.CANCELLATION_REQUESTED,
];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        role: true,
        avatarUrl: true,
      },
    });
  }

  async stats(userId: string) {
    const [bookings, completed, spend, reviews, favorites] = await this.prisma.$transaction([
      this.prisma.booking.count({ where: { customerId: userId } }),
      this.prisma.booking.count({ where: { customerId: userId, status: BookingStatus.COMPLETED } }),
      this.prisma.booking.aggregate({
        where: { customerId: userId, paymentStatus: 'PAID', status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        _sum: { totalPaise: true },
      }),
      this.prisma.review.count({ where: { customerId: userId } }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);
    const totalSpend = spend._sum.totalPaise ?? 0;
    const tier = totalSpend >= 5_000_000 ? 'Platinum' : totalSpend >= 2_500_000 ? 'Gold' : totalSpend >= 500_000 ? 'Silver' : 'Bronze';
    const active = await this.prisma.booking.findMany({
      where: { customerId: userId, status: { in: ACTIVE_STATUSES } },
      orderBy: { startsAt: 'asc' },
      take: 3,
      include: { service: { select: { name: true, imageUrl: true } }, vendor: { select: { name: true } } },
    });
    return { bookings, completed, totalSpendPaise: totalSpend, reviews, favorites, tier, upcoming: active };
  }

  // --------------------------------- Addresses -------------------------------

  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createAddress(userId: string, dto: AddressDto) {
    if (dto.isDefault) await this.clearDefault(userId);
    return this.prisma.address.create({ data: { ...dto, userId } });
  }

  async updateAddress(userId: string, id: string, dto: AddressDto) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found.');
    if (dto.isDefault) await this.clearDefault(userId);
    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async removeAddress(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found.');
    await this.prisma.address.delete({ where: { id } });
    return { deleted: true };
  }

  async setDefaultAddress(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found.');
    await this.clearDefault(userId);
    return this.prisma.address.update({ where: { id }, data: { isDefault: true } });
  }

  private async clearDefault(userId: string) {
    await this.prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  // --------------------------------- Favorites -------------------------------

  async listFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        service: {
          include: {
            vendor: { select: { id: true, name: true, slug: true, city: true, rating: true } },
            category: { select: { id: true, name: true, slug: true, tone: true } },
          },
        },
      },
    });
  }

  async addFavorite(userId: string, dto: FavoriteDto) {
    if (!dto.serviceId && !dto.vendorId) {
      throw new BadRequestException('Provide a serviceId or vendorId to favourite.');
    }
    const existing = dto.serviceId
      ? await this.prisma.favorite.findFirst({ where: { userId, serviceId: dto.serviceId } })
      : null;
    if (existing) return existing;
    return this.prisma.favorite.create({
      data: { userId, serviceId: dto.serviceId, vendorId: dto.vendorId },
    });
  }

  async removeFavorite(userId: string, id: string) {
    const existing = await this.prisma.favorite.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Favorite not found.');
    await this.prisma.favorite.delete({ where: { id } });
    return { deleted: true };
  }
}
