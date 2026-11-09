import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, Prisma, ServiceStatus, VendorStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { eachDate, istToUtc, utcToIstDate, utcToIstMinutes } from '../common/utils/time';
import {
  ACTIVE_BOOKING_STATUSES,
  buildDaySlots,
  DaySlot,
  defaultRules,
  SlotRule,
} from './availability.logic';

type Db = PrismaService | Prisma.TransactionClient;

const ACTIVE = ACTIVE_BOOKING_STATUSES as unknown as BookingStatus[];

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getDay(serviceId: string, dateIso?: string, staffId?: string, db: Db = this.prisma) {
    const date = dateIso ?? utcToIstDate(new Date());
    const context = await this.loadContext(serviceId, db, staffId);
    const todayIso = utcToIstDate(new Date());
    if (date < todayIso) {
      return this.emptyResponse(date, context, 'This date is in the past.');
    }
    const maxDate = new Date(Date.now() + context.service.maxAdvanceDays * 24 * 60 * 60 * 1000);
    if (date > utcToIstDate(maxDate)) {
      return this.emptyResponse(date, context, `Bookings open ${context.service.maxAdvanceDays} days ahead.`);
    }

    const dayStart = istToUtc(date, 0);
    const dayEnd = istToUtc(date, 24 * 60);
    const [rules, timeOff, busy] = await Promise.all([
      db.availabilityRule.findMany({
        where: { vendorId: context.vendorId, isActive: true },
      }),
      db.timeOff.findMany({
        where: { vendorId: context.vendorId, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } },
      }),
      db.booking.findMany({
        where: {
          vendorId: context.vendorId,
          status: { in: ACTIVE },
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
        select: { staffId: true, startsAt: true, endsAt: true },
      }),
    ]);

    const applicableRules: SlotRule[] = rules
      .filter((rule) => !staffId || rule.staffId === null || rule.staffId === staffId)
      .map((rule) => ({
        staffId: rule.staffId,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        slotIntervalMin: rule.slotIntervalMin,
      }));

    const fallback = applicableRules.length
      ? applicableRules
      : defaultRules().filter((rule) => this.weekdayMatches(rule, date));

    const slots = buildDaySlots({
      dateIso: date,
      durationMin: context.service.durationMin,
      bufferAfterMin: context.service.bufferAfterMin,
      rules: fallback,
      eligibleStaffIds: context.eligibleStaffIds,
      busy,
      timeOff,
      now: new Date(),
      noticeHours: context.service.noticeHours,
    });

    return {
      date,
      timezone: 'Asia/Kolkata',
      serviceId,
      serviceName: context.service.name,
      durationMin: context.service.durationMin,
      pricePaise: context.service.pricePaise,
      staffId: staffId ?? null,
      total: slots.filter((slot) => slot.available).length,
      slots,
    };
  }

  async getRange(serviceId: string, from: string, to: string, staffId?: string) {
    const dates = eachDate(from, to);
    if (dates.length > 31) throw new BadRequestException('Request at most 31 days at once.');
    const days = await Promise.all(dates.map((date) => this.getDay(serviceId, date, staffId)));
    return {
      serviceId,
      timezone: 'Asia/Kolkata',
      days: days.map((day) => ({
        date: day.date,
        availableCount: day.total,
        slots: day.slots,
      })),
    };
  }

  /** Used by the booking transaction to guarantee the chosen slot is still free. */
  async assertSlotAvailable(
    tx: Prisma.TransactionClient,
    input: { serviceId: string; startsAt: Date; staffId?: string | null },
  ): Promise<{ staffId: string | null; service: { durationMin: number; pricePaise: number } }> {
    const date = utcToIstDate(input.startsAt);
    const day = await this.getDay(input.serviceId, date, input.staffId ?? undefined, tx);
    const minute = utcToIstMinutes(input.startsAt);
    const slot = day.slots.find((candidate) => candidate.startMinute === minute && candidate.available);
    if (!slot) {
      throw new ConflictException('That time is no longer available. Please pick another slot.');
    }
    if (input.staffId && slot.staffIds.length && !slot.staffIds.includes(input.staffId)) {
      throw new ConflictException('This professional is no longer free at that time.');
    }
    const assigned = input.staffId ?? slot.staffIds[0] ?? null;
    return {
      staffId: assigned,
      service: { durationMin: day.durationMin, pricePaise: day.pricePaise },
    };
  }

  private async loadContext(serviceId: string, db: Db, staffId?: string) {
    const service = await db.service.findUnique({
      where: { id: serviceId },
      include: {
        vendor: { select: { id: true, status: true } },
        staffLinks: { select: { staffId: true } },
      },
    });
    if (!service) throw new NotFoundException('Service not found.');
    if (service.status !== ServiceStatus.PUBLISHED || service.vendor.status !== VendorStatus.APPROVED) {
      throw new NotFoundException('This service is not accepting bookings.');
    }

    let eligibleStaffIds: Array<string | null> = service.staffLinks.map((link) => link.staffId);
    if (staffId) {
      if (eligibleStaffIds.length && !eligibleStaffIds.includes(staffId)) {
        throw new BadRequestException('That professional does not offer this service.');
      }
      eligibleStaffIds = [staffId];
    }
    if (eligibleStaffIds.length === 0) eligibleStaffIds = [null];

    return {
      service,
      vendorId: service.vendorId,
      eligibleStaffIds,
    };
  }

  private weekdayMatches(rule: SlotRule & { weekday?: number }, dateIso: string) {
    if (rule.weekday === undefined) return true;
    const [y, m, d] = dateIso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() === rule.weekday;
  }

  private emptyResponse(date: string, context: Awaited<ReturnType<AvailabilityService['loadContext']>>, reason: string) {
    return {
      date,
      timezone: 'Asia/Kolkata',
      serviceId: context.service.id,
      serviceName: context.service.name,
      durationMin: context.service.durationMin,
      pricePaise: context.service.pricePaise,
      staffId: null,
      total: 0,
      slots: [] as DaySlot[],
      reason,
    };
  }
}
