import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Public, RawResponse, Roles } from '../common/decorators';
import { PaymentsService } from './payments.service';
import { CreateOrderDto, MockPayDto, RefundDto, VerifyPaymentDto } from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Get('config')
  @ApiOperation({ summary: 'Public gateway config (key id, mock mode)' })
  config() {
    return this.payments.configInfo();
  }

  @ApiBearerAuth('access-token')
  @Roles('customer')
  @Post('orders')
  @ApiOperation({ summary: 'Create a Razorpay order for a pending booking' })
  createOrder(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.payments.createOrder(user, dto.bookingId);
  }

  @ApiBearerAuth('access-token')
  @Roles('customer')
  @Post('verify')
  @ApiOperation({ summary: 'Verify Razorpay checkout signature and confirm the booking' })
  verify(@CurrentUser() user: AuthUser, @Body() dto: VerifyPaymentDto) {
    return this.payments.verify(user, dto);
  }

  @ApiBearerAuth('access-token')
  @Roles('customer')
  @Post('mock-pay')
  @ApiOperation({ summary: 'Sandbox payment shortcut (disabled in production)' })
  mockPay(@CurrentUser() user: AuthUser, @Body() dto: MockPayDto) {
    return this.payments.mockPay(user, dto.bookingId, dto.method);
  }

  @Public()
  @RawResponse()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @HttpCode(200)
  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay webhook receiver (HMAC verified, idempotent)' })
  webhook(@Req() req: RawBodyRequest<Request>) {
    return this.payments.webhook(req.rawBody ?? '', req.headers['razorpay-signature'] as string | undefined);
  }

  @ApiBearerAuth('access-token')
  @Roles('admin')
  @Post('refunds')
  @ApiOperation({ summary: 'Issue a full or partial refund' })
  refund(@CurrentUser() admin: AuthUser, @Body() dto: RefundDto) {
    return this.payments.refund(admin, dto);
  }

  @ApiBearerAuth('access-token')
  @Roles('admin')
  @Get('admin')
  @ApiOperation({ summary: 'List all gateway payments' })
  adminList(@Req() req: Request) {
    return this.payments.adminList(req.query as never);
  }
}
