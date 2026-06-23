import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class FailDeliveryDto {
  @ApiProperty({ required: false, example: 'Customer not reachable' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  reason?: string;
}
