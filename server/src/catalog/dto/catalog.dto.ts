import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class VendorQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Category slug or cuid' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Minimum rating, e.g. 4.5' })
  @IsNumberString()
  @IsOptional()
  rating?: string;

  @ApiPropertyOptional({ enum: ['rating', 'price_asc', 'price_desc', 'popular', 'newest'] })
  @IsIn(['rating', 'price_asc', 'price_desc', 'popular', 'newest'])
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional()
  @IsBooleanString()
  @IsOptional()
  verified?: string;
}

export class ServiceQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendor?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  minPrice?: string;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  maxPrice?: string;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  rating?: string;

  @ApiPropertyOptional({ enum: ['rating', 'price_asc', 'price_desc', 'popular', 'newest'] })
  @IsIn(['rating', 'price_asc', 'price_desc', 'popular', 'newest'])
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional()
  @IsBooleanString()
  @IsOptional()
  featured?: string;
}
