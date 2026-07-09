import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { INDIAN_PHONE_REGEX } from '../../../common/constants';

export class RequestOtpDto {
  @ApiProperty({
    description: 'Phone number in E.164 format',
    example: '+919876543210',
    required: false,
  })
  @ValidateIf((o: RequestOtpDto) => !o.email)
  @Matches(INDIAN_PHONE_REGEX, {
    message: 'Phone must be a valid Indian mobile number (e.g. +919876543210)',
  })
  phone?: string;

  @ApiProperty({
    description: 'Registered email — OTP is sent to the linked mobile number',
    example: 'merchant@demo.jebdekho.com',
    required: false,
  })
  @ValidateIf((o: RequestOtpDto) => !o.phone)
  @IsEmail({}, { message: 'Enter a valid email address' })
  email?: string;

  @ApiProperty({ required: false, description: 'Device ID for session tracking' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ required: false, description: 'Human-readable device name' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
