import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputePriority, DisputeStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateDisputeDto {
  @ApiProperty()
  @IsString()
  bookingId: string;

  @ApiProperty({ example: 'Service not delivered as described' })
  @IsString()
  @MinLength(4)
  @MaxLength(120)
  reason: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  description: string;

  @ApiPropertyOptional({ enum: DisputePriority })
  @IsEnum(DisputePriority)
  @IsOptional()
  priority?: DisputePriority;
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: ['UNDER_REVIEW', 'RESOLVED', 'REJECTED'] })
  @IsIn(['UNDER_REVIEW', 'RESOLVED', 'REJECTED'])
  status: 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  resolution: string;

  @ApiPropertyOptional({ enum: DisputePriority })
  @IsEnum(DisputePriority)
  @IsOptional()
  priority?: DisputePriority;
}

export class DisputeQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: DisputeStatus })
  @IsEnum(DisputeStatus)
  @IsOptional()
  status?: DisputeStatus;

  @ApiPropertyOptional({ enum: DisputePriority })
  @IsEnum(DisputePriority)
  @IsOptional()
  priority?: DisputePriority;
}
