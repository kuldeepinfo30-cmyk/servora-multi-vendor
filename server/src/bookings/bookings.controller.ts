import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators';
import { BookingsService } from './bookings.service';
import {
  BookingQueryDto,
  CancelBookingDto,
  CreateBookingDto,
  QuoteBookingDto,
  RescheduleBookingDto,
  VendorBookingStatusDto,
} from './dto/booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth('access-token')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Roles('customer')
  @Post('quote')
  @ApiOperation({ summary: 'Price a booking including add-ons, coupon and commission split' })
  quote(@Body() dto: QuoteBookingDto, @CurrentUser('id') userId: string) {
    return this.bookings.quote(dto, userId);
  }

  @Roles('customer')
  @Post()
  @ApiOperation({
    summary: 'Create a booking — SERIALIZABLE transaction + advisory lock prevent double booking',
  })
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser('id') userId: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.bookings.create(userId, dto, idempotencyKey);
  }

  @Get()
  @ApiOperation({ summary: 'List bookings scoped to the signed-in role' })
  list(@CurrentUser() user: AuthUser, @Query() query: BookingQueryDto) {
    return this.bookings.list(user, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Booking counters for the current role' })
  stats(@CurrentUser() user: AuthUser) {
    return this.bookings.stats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Booking detail (role-checked)' })
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookings.detail(user, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel with policy-based refund calculation' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CancelBookingDto) {
    return this.bookings.cancel(user, id, dto);
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: 'Move a booking to a new available slot' })
  reschedule(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RescheduleBookingDto) {
    return this.bookings.reschedule(user, id, dto);
  }

  @Roles('vendor', 'admin')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Vendor/admin booking transition (confirm, start, complete, no-show…)' })
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: VendorBookingStatusDto) {
    return this.bookings.vendorUpdateStatus(user, id, dto);
  }
}
