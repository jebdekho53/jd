import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({
    example: 3,
    description: 'New absolute quantity (replaces current). Set to 0 to remove the item.',
  })
  @IsNumber()
  @Min(0)
  quantity: number;
}
