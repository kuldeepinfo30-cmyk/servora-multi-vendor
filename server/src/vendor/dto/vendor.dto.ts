import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceType, ServiceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdateVendorProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  area?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coverUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  gallery?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  radiusKm?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  hours?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  policies?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  socials?: Record<string, unknown>;
}

export class AddOnDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  pricePaise: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  durationMin?: number;
}

export class ServiceQuestionDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty({ enum: ['text', 'select', 'textarea'] })
  @IsString()
  type: 'text' | 'select' | 'textarea';

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  required?: boolean;
}

export class CreateServiceDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(90)
  name: string;

  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  description: string;

  @ApiProperty({ description: 'Price in paise', example: 249900 })
  @IsInt()
  @Min(0)
  pricePaise: number;

  @ApiProperty({ description: 'Duration in minutes', example: 180 })
  @IsInt()
  @Min(15)
  durationMin: number;

  @ApiPropertyOptional({ enum: PriceType })
  @IsEnum(PriceType)
  @IsOptional()
  priceType?: PriceType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includes?: string[];

  @ApiPropertyOptional({ type: [AddOnDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddOnDto)
  @IsOptional()
  addOns?: AddOnDto[];

  @ApiPropertyOptional({ type: [ServiceQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceQuestionDto)
  @IsOptional()
  questions?: ServiceQuestionDto[];

  @ApiPropertyOptional({ enum: ServiceStatus })
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;

  @ApiPropertyOptional({ default: 4 })
  @IsInt()
  @Min(0)
  @Max(72)
  @IsOptional()
  noticeHours?: number;

  @ApiPropertyOptional({ default: 60 })
  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  maxAdvanceDays?: number;

  @ApiPropertyOptional({ enum: ['Flexible', 'Moderate', 'Strict'] })
  @IsString()
  @IsOptional()
  cancellationPolicy?: string;

  @ApiPropertyOptional({ enum: ['Customer location', 'Vendor location', 'Both'] })
  @IsString()
  @IsOptional()
  serviceAt?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  availableToday?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  @IsOptional()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  bufferBeforeMin?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  bufferAfterMin?: number;
}

export class UpdateServiceDto extends CreateServiceDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  declare name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  declare categoryId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  declare description: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  declare pricePaise: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  declare durationMin: number;
}

export class CreateStaffDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  role: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionRate?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  @ArrayMaxSize(50)
  @IsOptional()
  serviceIds?: string[];

  @ApiPropertyOptional({ enum: ['active', 'on_leave', 'inactive'] })
  @IsString()
  @IsOptional()
  status?: string;
}

export class AvailabilityRuleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  staffId?: string;

  @ApiProperty({ minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @ApiProperty({ description: 'Minutes from midnight', example: 540 })
  @IsInt()
  @Min(0)
  @Max(1440)
  startMinute: number;

  @ApiProperty({ example: 1080 })
  @IsInt()
  @Min(0)
  @Max(1440)
  endMinute: number;

  @ApiPropertyOptional({ default: 30 })
  @IsInt()
  @Min(5)
  @Max(240)
  @IsOptional()
  slotIntervalMin?: number;
}

export class ReplaceAvailabilityDto {
  @ApiProperty({ type: [AvailabilityRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRuleDto)
  rules: AvailabilityRuleDto[];
}

export class TimeOffDto {
  @ApiProperty()
  @IsString()
  startsAt: string;

  @ApiProperty()
  @IsString()
  endsAt: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  staffId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
