import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum RegistrationRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
}

export class RegisterDto {
  @ApiProperty({ example: 'Aarav Mehta' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'aarav@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+91 98200 12345' })
  @IsString()
  @Matches(/^[+()\-\s\d]{8,18}$/, { message: 'Enter a valid phone number.' })
  phone: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'S3curePass!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ enum: RegistrationRole, default: RegistrationRole.CUSTOMER })
  @IsEnum(RegistrationRole)
  @IsOptional()
  role: RegistrationRole = RegistrationRole.CUSTOMER;

  @ApiPropertyOptional({ description: 'Required when role = VENDOR', example: 'SparkleHome Cleaning Co.' })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiPropertyOptional({ description: 'Category cuid — required for vendors' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Andheri West' })
  @IsString()
  @IsOptional()
  area?: string;
}
