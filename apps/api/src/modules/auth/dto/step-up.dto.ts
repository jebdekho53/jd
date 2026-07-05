import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { PHONE_E164_REGEX } from '../../../common/constants';

export class StepUpDto {
  @ApiProperty({ required: false, example: 'SecurePass123!' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ required: false, example: '+919876543210' })
  @IsOptional()
  @Matches(PHONE_E164_REGEX, {
    message: 'Phone must be in E.164 format',
  })
  phone?: string;

  @ApiProperty({ required: false, example: '123456', description: '6-digit OTP code' })
  @IsOptional()
  @IsString()
  @Length(4, 8)
  code?: string;
}
