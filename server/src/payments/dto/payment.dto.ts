import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

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
