import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { ResetPortal } from './forgot-password.dto';

export class EmailLoginDto {
  /** 'merchant' looks this email up against the merchant-only login
   *  credential instead of the account's personal (buyer) email. */
  @ApiProperty({ required: false, enum: ['buyer', 'merchant', 'franchise', 'admin'], default: 'buyer' })
  @IsOptional()
  @IsIn(['buyer', 'merchant', 'franchise', 'admin'])
  portal?: ResetPortal;

  @ApiProperty({ example: 'rahul@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
