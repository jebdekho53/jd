import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';
import { INDIAN_PHONE_REGEX } from '../../../common/constants';

export class ResetPasswordDto {
  @ApiProperty({ required: false, description: 'Email reset token from link' })
  @ValidateIf((o: ResetPasswordDto) => !o.phone)
  @IsString()
  token?: string;

  @ApiProperty({ required: false, example: '+919876543210' })
  @ValidateIf((o: ResetPasswordDto) => !o.token)
  @Matches(INDIAN_PHONE_REGEX, { message: 'Phone must be a valid Indian mobile number (+91XXXXXXXXXX)' })
  phone?: string;

  @ApiProperty({ required: false, example: '123456' })
  @ValidateIf((o: ResetPasswordDto) => Boolean(o.phone))
  @IsString()
  code?: string;

  @ApiProperty({ example: 'NewSecurePass123!' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
