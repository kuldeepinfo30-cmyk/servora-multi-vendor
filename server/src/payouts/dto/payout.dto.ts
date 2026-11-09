import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutStatus } from '@prisma/client';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RequestPayoutDto {
  @ApiProperty({ description: 'Amount in paise', example: 1500000 })
  @IsInt()
  @Min(50000)
  amountPaise: number;

  @ApiPropertyOptional({ default: 'IMPS' })
  @IsString()
  @IsOptional()
  method?: string;
}

export class UpdatePayoutDto {
  @ApiProperty({ enum: ['APPROVED', 'PROCESSING', 'PAID', 'REJECTED', 'FAILED'] })
  @IsIn(['APPROVED', 'PROCESSING', 'PAID', 'REJECTED', 'FAILED'])
  status: 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'FAILED';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  failureReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reference?: string;
}
