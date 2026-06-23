import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateInventoryDto {
  @ApiProperty({
    example: 50,
    description: 'New absolute quantity (not a delta — replaces current stock)',
  })
  @IsNumber()
  @Min(0, { message: 'Inventory quantity cannot be negative' })
  quantity: number;

  @ApiProperty({ required: false, example: 5, description: 'Low-stock alert threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}
