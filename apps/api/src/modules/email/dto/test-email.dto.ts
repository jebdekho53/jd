import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TestEmailDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string;
}
