import { Injectable, Logger } from '@nestjs/common';
import { AuditSeverity, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated, skipTake } from '../common/dto/pagination.dto';

export interface AuditInput {
  actorId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  severity?: AuditSeverity;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          actorName: input.actorName,
          actorRole: input.actorRole,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          ip: input.ip,
          userAgent: input.userAgent,
          severity: input.severity ?? AuditSeverity.ROUTINE,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.warn(`Audit write failed: ${(error as Error).message}`);
      return null;
    }
  }

  async list(query: PaginationDto & { severity?: string; entity?: string; actorId?: string }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.severity ? { severity: query.severity as AuditSeverity } : {}),
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.search
        ? {
            OR: [
              { action: { contains: query.search, mode: 'insensitive' } },
              { actorName: { contains: query.search, mode: 'insensitive' } },
              { entityId: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async stats() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [today, critical, privileged, actors] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: since }, severity: 'CRITICAL' } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: since }, severity: 'REVIEW' } }),
      this.prisma.auditLog.groupBy({
        by: ['actorId'],
        where: { createdAt: { gte: since } },
        orderBy: { actorId: 'asc' },
        _count: true,
      }),
    ]);
    return { events24h: today, critical, privileged, activeActors: actors.length };
  }
}
