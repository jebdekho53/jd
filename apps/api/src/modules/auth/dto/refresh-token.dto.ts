import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token (send in body if not using httpOnly cookie)' })
  @IsString()
  refreshToken: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
