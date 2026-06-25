import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
  @IsString()
  variantId!: string;

  @IsString()
  sku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateTransferDto {
  @IsString()
  fromStoreId!: string;

  @IsString()
  toStoreId!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items!: TransferItemDto[];
}

export class NetworkQueryDto {
  @IsOptional()
  @IsString()
  storeId?: string;
}
