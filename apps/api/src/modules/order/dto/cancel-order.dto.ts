import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ required: false, example: 'Changed my mind', description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  reason?: string;
}
