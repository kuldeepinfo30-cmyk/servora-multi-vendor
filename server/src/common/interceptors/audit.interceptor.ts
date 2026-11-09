import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_KEY, AuditMeta } from '../decorators';
import { AuditService } from '../../audit/audit.service';

const MUTATIONS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Records privileged/admin mutations automatically, and any handler decorated
 * with @Audit(...) explicitly. Failures are swallowed — auditing must never
 * break the request itself.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method: string = request.method;
    const explicit = this.reflector.getAllAndOverride<AuditMeta>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isAdminArea = user?.role === 'ADMIN';
    const shouldRecord = explicit || (isAdminArea && MUTATIONS.has(method));
    if (!shouldRecord) return next.handle();

    const path = String(request.originalUrl ?? '');
    if (path.includes('/webhooks/') || path.includes('/auth/')) return next.handle();

    return next.handle().pipe(
      tap({
        next: () => {
          this.audit
            .record({
              actorId: user?.id,
              actorName: user?.name ?? 'System',
              actorRole: user?.role ?? 'SYSTEM',
              action: explicit?.action ?? `${method} ${path.split('?')[0]}`,
              entity: explicit?.entity ?? path.split('/')[2] ?? 'system',
              entityId: request.params?.id ?? request.params?.bookingId,
              ip: request.ip,
              userAgent: request.headers?.['user-agent'],
              severity: explicit?.severity ?? (method === 'DELETE' ? 'REVIEW' : 'ROUTINE'),
              metadata: { body: sanitize(request.body), params: request.params, query: request.query },
            })
            .catch(() => undefined);
        },
      }),
    );
  }
}

function sanitize(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const clone: Record<string, unknown> = { ...(value as Record<string, unknown>) };
  for (const key of ['password', 'currentPassword', 'newPassword', 'code', 'token', 'secret']) {
    if (key in clone) clone[key] = '[redacted]';
  }
  return clone;
}
