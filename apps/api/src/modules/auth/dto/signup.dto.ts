import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { INDIAN_PHONE_REGEX } from '../../../common/constants';
import type { ResetPortal } from './forgot-password.dto';

export class EmailSignupDto {
  /** Which portal is signing up. 'merchant' keeps this email/password on a
   *  merchant-only credential, never the account's personal (buyer) email —
   *  see AuthService.signup(). */
  @ApiProperty({ required: false, enum: ['buyer', 'merchant', 'franchise', 'admin'], default: 'buyer' })
  @IsOptional()
  @IsIn(['buyer', 'merchant', 'franchise', 'admin'])
  portal?: ResetPortal;

  @ApiProperty({ example: 'Rahul Sharma' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'rahul@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class MobileSignupRequestOtpDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '+919876543210' })
  @Matches(INDIAN_PHONE_REGEX, { message: 'Phone must be a valid Indian mobile number (+91XXXXXXXXXX)' })
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
