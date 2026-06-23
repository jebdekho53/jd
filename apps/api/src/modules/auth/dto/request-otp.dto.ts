import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { PHONE_E164_REGEX } from '../../../common/constants';

export class RequestOtpDto {
  @ApiProperty({
    description: 'Phone number in E.164 format',
    example: '+919876543210',
  })
  @Matches(PHONE_E164_REGEX, {
    message: 'Phone must be in E.164 format (e.g. +919876543210)',
  })
  phone: string;

  @ApiProperty({ required: false, description: 'Device ID for session tracking' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ required: false, description: 'Human-readable device name' })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
