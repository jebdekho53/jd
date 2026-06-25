import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, Matches, ValidateIf } from 'class-validator';
import { PHONE_E164_REGEX } from '../../../common/constants';

export class ForgotPasswordDto {
  @ApiProperty({ required: false, example: 'rahul@example.com' })
  @ValidateIf((o: ForgotPasswordDto) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '+919876543210' })
  @ValidateIf((o: ForgotPasswordDto) => !o.email)
  @Matches(PHONE_E164_REGEX, { message: 'Phone must be in E.164 format' })
  phone?: string;
}
