import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateProductStatusDto {
  @ApiProperty({
    example: true,
    description: 'true = active (visible to buyers), false = inactive (hidden)',
  })
  @IsBoolean()
  isActive: boolean;
}
