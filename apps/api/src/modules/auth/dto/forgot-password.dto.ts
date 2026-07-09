import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, Matches, ValidateIf } from 'class-validator';
import { INDIAN_PHONE_REGEX } from '../../../common/constants';

export class ForgotPasswordDto {
  @ApiProperty({ required: false, example: 'rahul@example.com' })
  @ValidateIf((o: ForgotPasswordDto) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '+919876543210' })
  @ValidateIf((o: ForgotPasswordDto) => !o.email)
  @Matches(INDIAN_PHONE_REGEX, { message: 'Phone must be a valid Indian mobile number (+91XXXXXXXXXX)' })
  phone?: string;
}
