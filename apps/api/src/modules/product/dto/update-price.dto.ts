import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePriceDto {
  @ApiProperty({
    example: 45.0,
    description: 'New selling price — must be ≤ mrp if mrp is set',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    required: false,
    example: 59.0,
    description: 'MRP — if omitted, existing MRP is preserved',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp?: number;
}
