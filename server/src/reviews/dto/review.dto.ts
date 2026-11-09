import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  bookingId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(90)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  text: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

export class ReplyReviewDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  text: string;
}

export class ModerateReviewDto {
  @ApiProperty({ enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ReviewQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Only reviews awaiting a vendor reply' })
  @IsOptional()
  unanswered?: string;
}
