import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Something went wrong. Please try again.';
    let code = 'INTERNAL_ERROR';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') message = body;
      else if (typeof body === 'object' && body) {
        const payload = body as Record<string, unknown>;
        message = (payload.message as string | string[]) ?? exception.message;
        code = (payload.error as string) ?? exception.name;
        details = payload.details;
      }
      if (status === 429) code = 'RATE_LIMITED';
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE';
        const target = (exception.meta?.target as string[] | string | undefined) ?? 'record';
        message = `A record with this ${Array.isArray(target) ? target.join(', ') : target} already exists.`;
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = 'The requested record could not be found.';
      } else if (exception.code === 'P2034') {
        status = HttpStatus.CONFLICT;
        code = 'WRITE_CONFLICT';
        message = 'That slot was just taken. Please choose another time.';
      } else {
        message = 'A database error occurred.';
      }
      this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
    } else if (
      exception instanceof Prisma.PrismaClientUnknownRequestError &&
      /23P01|exclusion constraint|booking_(staff|vendor)_no_overlap/i.test(exception.message)
    ) {
      // PostgreSQL exclusion_violation raised by the booking overlap guards.
      status = HttpStatus.CONFLICT;
      code = 'SLOT_UNAVAILABLE';
      message = 'That slot was just booked. Please choose another time.';
      this.logger.warn(`Booking overlap blocked: ${request.method} ${request.originalUrl}`);
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.originalUrl} → ${status}`);
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
        statusCode: status,
      },
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
