import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CmsStatus, ServiceStatus, UserStatus, VendorStatus } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AdminQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateVendorStatusDto {
  @ApiProperty({ enum: VendorStatus })
  @IsEnum(VendorStatus)
  status: VendorStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateCommissionDto {
  @ApiProperty({ minimum: 0, maximum: 40, example: 12.5 })
  @IsNumber()
  @Min(0)
  @Max(40)
  commissionRate: number;
}

export class ModerateServiceDto {
  @ApiProperty({ enum: ServiceStatus })
  @IsEnum(ServiceStatus)
  status: ServiceStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty()
  @IsString()
  short: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'sparkles' })
  @IsString()
  icon: string;

  @ApiPropertyOptional({ default: 'brand' })
  @IsString()
  @IsOptional()
  tone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  fromPricePaise?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subcategories?: string[];

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CmsPageDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty()
  @IsString()
  excerpt: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ enum: CmsStatus })
  @IsEnum(CmsStatus)
  @IsOptional()
  status?: CmsStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  seoDescription?: string;
}

export class ApplicationDecisionDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'UNDER_REVIEW'] })
  @IsIn(['APPROVED', 'REJECTED', 'UNDER_REVIEW'])
  status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ description: 'Key/value map of platform settings', example: { commissionRate: 12.5 } })
  @IsObject()
  settings: Record<string, unknown>;
}

export class InviteAdminDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiPropertyOptional({ default: 'Operations' })
  @IsString()
  @IsOptional()
  title?: string;
}
