import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

/**
 * All fields optional. Variants cannot be replaced in bulk via PATCH —
 * use dedicated variant endpoints (Phase 4). quantity/lowStockThreshold
 * have dedicated inventory endpoint.
 */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['variants', 'quantity', 'lowStockThreshold', 'hsnCodeId'] as const),
) {
  @ApiPropertyOptional({ description: 'Required if provided; cannot be empty or null' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  hsnCodeId?: string;
}
