import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';
import { PHONE_E164_REGEX } from '../../../common/constants';

export class ResetPasswordDto {
  @ApiProperty({ required: false, description: 'Email reset token from link' })
  @ValidateIf((o: ResetPasswordDto) => !o.phone)
  @IsString()
  token?: string;

  @ApiProperty({ required: false, example: '+919876543210' })
  @ValidateIf((o: ResetPasswordDto) => !o.token)
  @Matches(PHONE_E164_REGEX, { message: 'Phone must be in E.164 format' })
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
