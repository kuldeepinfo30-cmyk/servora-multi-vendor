import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @Matches(/^[+()\-\s\d]{8,18}$/)
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class AddressDto {
  @ApiPropertyOptional({ enum: ['Home', 'Work', 'Other'], default: 'Home' })
  @IsIn(['Home', 'Work', 'Other'])
  @IsOptional()
  label?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  line1: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  line2?: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @Matches(/^\d{5,6}$/, { message: 'Enter a valid pincode.' })
  pincode: string;

  @ApiProperty()
  @Matches(/^[+()\-\s\d]{8,18}$/)
  phone: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class FavoriteDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vendorId?: string;
}
