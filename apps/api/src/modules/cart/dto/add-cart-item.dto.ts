import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: 'p-abc123', description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'v-xyz456', description: 'Variant ID (must belong to the product)' })
  @IsString()
  variantId: string;

  @ApiProperty({ example: 2, description: 'Quantity to add (≥ 1)' })
  @IsNumber()
  @Min(1)
  quantity: number;
}
