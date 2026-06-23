import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    required: false,
    description: 'Refresh token to revoke (send in body if not using httpOnly cookie)',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
