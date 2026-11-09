import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OtpPurpose } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'customer@servora.demo' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'demo1234' })
  @IsString()
  @MinLength(4)
  password: string;

  @ApiPropertyOptional({ description: 'Keep the refresh cookie for 30 days', default: true })
  @IsOptional()
  remember?: boolean;
}

export class RefreshDto {
  @ApiPropertyOptional({ description: 'Refresh token if not using the httpOnly cookie' })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

export class OtpRequestDto {
  @ApiProperty({ example: 'customer@servora.demo' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: OtpPurpose, default: OtpPurpose.PASSWORD_RESET })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose = OtpPurpose.PASSWORD_RESET;
}

export class OtpVerifyDto {
  @ApiProperty({ example: 'customer@servora.demo' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({ enum: OtpPurpose, default: OtpPurpose.PASSWORD_RESET })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose = OtpPurpose.PASSWORD_RESET;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Short-lived token returned by OTP verification' })
  @IsString()
  token: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class DemoLoginDto {
  @ApiProperty({ enum: ['customer', 'vendor', 'admin'] })
  @IsString()
  role: 'customer' | 'vendor' | 'admin';
}
