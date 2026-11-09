import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class AvailabilityQueryDto {
  @ApiProperty({ description: 'Service id' })
  @IsString()
  serviceId: string;

  @ApiPropertyOptional({ example: '2026-11-12' })
  @Matches(DATE, { message: 'date must be YYYY-MM-DD' })
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Preferred staff member id' })
  @IsString()
  @IsOptional()
  staffId?: string;
}

export class AvailabilityRangeDto {
  @ApiProperty({ description: 'Service id' })
  @IsString()
  serviceId: string;

  @ApiProperty({ example: '2026-11-12' })
  @Matches(DATE)
  from: string;

  @ApiProperty({ example: '2026-11-19' })
  @Matches(DATE)
  to: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  staffId?: string;
}
