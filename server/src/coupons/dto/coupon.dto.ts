import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  @MinLength(2)
  code: string;

  @ApiProperty({ description: 'Order value in paise', example: 249900 })
  @IsInt()
  @Min(1)
  amountPaise: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serviceId?: string;
}

export class CreateCouponDto {
  @ApiProperty({ example: 'FESTIVE15' })
  @IsString()
  @MinLength(2)
  code: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ description: 'Percent (1-100) or flat paise' })
  @IsInt()
  @Min(1)
  value: number;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  minOrderPaise?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  maxDiscountPaise?: number;

  @ApiPropertyOptional({ default: 1000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  perUserLimit?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiProperty()
  @IsDateString()
  expiresAt: string;

  @ApiPropertyOptional({ default: 'all' })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorId?: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SCHEDULED', 'EXPIRED', 'DISABLED'] })
  @IsIn(['ACTIVE', 'SCHEDULED', 'EXPIRED', 'DISABLED'])
  @IsOptional()
  status?: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  @Max(100)
  value?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
