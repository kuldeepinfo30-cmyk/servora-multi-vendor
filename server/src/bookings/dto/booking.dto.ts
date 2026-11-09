import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, PaymentMethod } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QuoteBookingDto {
  @ApiProperty()
  @IsString()
  serviceId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  addOnIds?: string[] = [];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  participants?: number;
}

export class CreateBookingDto extends QuoteBookingDto {
  @ApiProperty({ example: '2026-11-12T04:30:00.000Z', description: 'UTC instant of the IST slot start' })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  staffId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  addressId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.UPI })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod = PaymentMethod.UPI;
}

export class RescheduleBookingDto {
  @ApiProperty({ example: '2026-11-14T05:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  staffId?: string;
}

export class CancelBookingDto {
  @ApiProperty({ example: 'Plans changed' })
  @IsString()
  reason: string;
}

export class BookingQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ description: 'Admin only' })
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Admin only' })
  @IsString()
  @IsOptional()
  customerId?: string;
}

export class VendorBookingStatusDto {
  @ApiProperty({ enum: ['CONFIRMED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] })
  @IsEnum({ CONFIRMED: 'CONFIRMED', REJECTED: 'REJECTED', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', NO_SHOW: 'NO_SHOW', CANCELLED: 'CANCELLED' })
  status: 'CONFIRMED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
