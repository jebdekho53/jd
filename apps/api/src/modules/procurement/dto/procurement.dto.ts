import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { VendorDisputeStatus } from '@prisma/client';

export class ProcurementQueryDto {
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  vendorType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  moqMax?: number;

  @IsOptional()
  @IsString()
  gstRate?: string;
}

export class AddCartItemDto {
  @IsString()
  vendorProductId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddCartItemDto)
  items!: AddCartItemDto[];

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  storeId?: string;
}

export class CreateVendorOrderDto {
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  useCredit?: boolean;
}

export class CreateVendorProductDto {
  @IsString()
  catalogId!: string;

  @IsString()
  name!: string;

  @IsString()
  sku!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  hsnCode?: string;

  @IsOptional()
  gstRate?: number;

  basePrice!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  moq?: number;

  @IsOptional()
  @IsInt()
  leadTimeDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableQty?: number;
}

export class ShipVendorOrderDto {
  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

export class CreateReturnDto {
  @IsString()
  reason!: string;
}

export class CreateDisputeDto {
  @IsString()
  reason!: string;
}

export class ResolveReturnDto {
  @IsBoolean()
  approve!: boolean;
}

export class ResolveDisputeDto {
  @IsString()
  resolution!: string;

  @IsOptional()
  @IsEnum(VendorDisputeStatus)
  status?: VendorDisputeStatus;
}
