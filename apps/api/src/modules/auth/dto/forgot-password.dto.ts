import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, Matches, ValidateIf } from 'class-validator';
import { INDIAN_PHONE_REGEX } from '../../../common/constants';

export type ResetPortal = 'buyer' | 'merchant' | 'franchise' | 'admin';

export class ForgotPasswordDto {
  /** Which portal the request came from — the reset link must land back there. */
  @ApiProperty({ required: false, enum: ['buyer', 'merchant', 'franchise', 'admin'], default: 'buyer' })
  @IsOptional()
  @IsIn(['buyer', 'merchant', 'franchise', 'admin'])
  portal?: ResetPortal;

  @ApiProperty({ required: false, example: 'rahul@example.com' })
  @ValidateIf((o: ForgotPasswordDto) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '+919876543210' })
  @ValidateIf((o: ForgotPasswordDto) => !o.email)
  @Matches(INDIAN_PHONE_REGEX, { message: 'Phone must be a valid Indian mobile number (+91XXXXXXXXXX)' })
  phone?: string;
}
