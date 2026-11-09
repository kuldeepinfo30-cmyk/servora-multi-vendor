import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RAW_RESPONSE_KEY } from '../decorators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector?: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const raw = this.reflector?.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (raw) return next.handle();

    return next.handle().pipe(
      map((payload) => {
        if (payload === undefined) return payload;
        // Paginated services already return { data, meta }; keep one envelope.
        if (payload && typeof payload === 'object' && 'data' in payload && 'meta' in payload) {
          return { success: true, ...(payload as object) };
        }
        return { success: true, data: payload };
      }),
    );
  }
}
