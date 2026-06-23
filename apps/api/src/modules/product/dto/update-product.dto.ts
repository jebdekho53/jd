import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * All fields optional. Variants cannot be replaced in bulk via PATCH —
 * use dedicated variant endpoints (Phase 4). quantity/lowStockThreshold
 * have dedicated inventory endpoint.
 */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['variants', 'quantity', 'lowStockThreshold'] as const),
) {}
