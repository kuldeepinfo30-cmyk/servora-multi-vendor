import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  bookingId: string;
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  razorpay_order_id: string;

  @ApiProperty()
  @IsString()
  razorpay_payment_id: string;

  @ApiProperty()
  @IsString()
  razorpay_signature: string;
}

/**
 * Storefront checkout is amount-first because the demo React app keeps its
 * bookings in local state. Real deployments should create the order from a
 * server-side booking (see `CreateOrderDto`) instead of trusting an amount
 * posted by the browser.
 */
export class StorefrontOrderDto {
  @ApiProperty({ description: 'Amount in paise (₹1 = 100)', minimum: 100, maximum: 5_000_000 })
  @IsInt()
  @Min(100)
  @Max(5_000_000)
  amountPaise: number;

  @ApiProperty({ description: 'Your booking/payment reference (max 64 chars)' })
  @IsString()
  @Length(3, 64)
  receipt: string;

  @ApiPropertyOptional({ description: 'Short description shown in Razorpay checkout' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  description?: string;

  @ApiPropertyOptional({ description: 'Free-form metadata (max 12 keys, 200 chars per value)' })
  @IsOptional()
  @IsObject()
  notes?: Record<string, string>;
}

export class MockPayDto {
  @ApiProperty()
  @IsString()
  bookingId: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.UPI })
  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;
}

export class RefundDto {
  @ApiProperty()
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Amount in paise; omit for full refund' })
  @IsOptional()
  amountPaise?: number;

  @ApiProperty()
  @IsString()
  reason: string;
}
