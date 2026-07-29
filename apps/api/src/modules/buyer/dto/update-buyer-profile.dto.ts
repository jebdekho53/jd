import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateBuyerProfileDto {
  @ApiProperty({ required: false, example: 'Priya Sharma' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @ApiProperty({ required: false, example: 'priya@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
