import { ApiProperty } from '@nestjs/swagger';
import type {
  ClaimApprovalMode,
  ClaimProofRequirement,
  ClaimRefundMethod,
  PreparedFoodPolicy,
  ReturnClaimReason,
} from '@prisma/client';
import { GstSlab } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  Matches,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ClaimApprovalModeEnum,
  ClaimProofRequirementEnum,
  ClaimRefundMethodEnum,
  PreparedFoodPolicyEnum,
  ReturnClaimReasonEnum,
} from '../../../common/constants/claim-policy.enums';

const SKU_REGEX = /^[A-Za-z0-9_-]{2,50}$/;

export class CreateVariantDto {
  @ApiProperty({ example: 'SKU-500G', description: 'Unique SKU within this store' })
  @IsString()
  @Matches(SKU_REGEX, { message: 'SKU must be 2-50 alphanumeric characters, dashes, or underscores' })
  sku: string;

  @ApiProperty({ example: '500g', description: 'Human-readable variant name (e.g. 500g, 1kg)' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ example: 49.0, description: 'Selling price (must be ≤ mrp)' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ required: false, example: 59.0, description: 'Maximum retail price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp?: number;

  @ApiProperty({ required: false, example: 500, description: 'Weight in grams' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  weightGrams?: number;

  @ApiProperty({ required: false, example: 0, description: 'Initial stock quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiProperty({ required: false, example: 5, description: 'Low-stock alert threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ProductSpecificationDto {
  @ApiProperty({ example: 'RAM' })
  @IsString()
  @Length(1, 60)
  label: string;

  @ApiProperty({ example: '8 GB' })
  @IsString()
  @Length(1, 200)
  value: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Amul Full Cream Milk' })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiProperty({ required: false, example: 'Fresh full cream milk from Amul' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiProperty({ required: false, example: 'Amul' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  brand?: string;

  // ── Electronics / gadgets ──────────────────────────────────────────────────
  @ApiProperty({ required: false, example: 'SM-A546E', description: 'Model number (electronics)' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  modelNumber?: string;

  @ApiProperty({ required: false, example: 12, description: 'Warranty period in months (electronics)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  warrantyMonths?: number;

  @ApiProperty({
    required: false,
    type: [ProductSpecificationDto],
    description: 'Structured spec sheet (RAM, Storage, Battery…) for electronics',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  specifications?: ProductSpecificationDto[];

  @ApiProperty({ required: false, example: 'AMUL-MILK-500', description: 'Master SKU (optional)' })
  @IsOptional()
  @IsString()
  @Matches(SKU_REGEX, { message: 'SKU must be alphanumeric, dashes, or underscores' })
  sku?: string;

  @ApiProperty({ required: false, description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: ['https://cdn.example.com/milk.png'], type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one product image is required' })
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  imageUrls!: string[];

  @ApiProperty({ example: 49.0, description: 'Base selling price (must be ≤ mrp if set)' })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ required: false, example: 59.0, description: 'MRP for the default variant' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp?: number;

  @ApiProperty({ required: false, example: 'piece', description: 'Unit (piece, kg, litre, pack…)' })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  unit?: string;

  @ApiProperty({ required: false, example: 500, description: 'Weight in grams' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  weightGrams?: number;

  @ApiProperty({ required: false, example: true, description: 'true=veg, false=non-veg, null=N/A' })
  @IsOptional()
  @IsBoolean()
  isVeg?: boolean;

  @ApiProperty({ required: false, example: ['dairy', 'milk', 'amul'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ required: false, example: 10, description: 'Initial stock for default variant' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiProperty({ required: false, example: 5, description: 'Low-stock threshold for default variant' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiProperty({
    required: false,
    type: [CreateVariantDto],
    description: 'Additional variants beyond the default. Leave empty for single-variant products.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ingredients?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shelfLife?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  manufacturerName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  manufacturerAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fssaiLicense?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  storageInstructions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  disclaimer?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  @ApiProperty({ description: 'Required HSN code reference ID for GST compliance and logistics' })
  @IsString()
  @IsNotEmpty()
  hsnCodeId!: string;

  @ApiProperty({ required: false, enum: GstSlab })
  @IsOptional()
  @IsEnum(GstSlab)
  gstSlab?: GstSlab;

  @ApiProperty({ required: false, enum: ['GOODS', 'SERVICES', 'EXEMPT', 'NIL_RATED'] })
  @IsOptional()
  @IsEnum(['GOODS', 'SERVICES', 'EXEMPT', 'NIL_RATED'])
  taxCategory?: 'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED';

  // Return / refund / replacement policy (merchant-controlled)
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isReturnable?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isRefundable?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isReplaceable?: boolean;

  @ApiProperty({ required: false, description: 'Return window in hours' })
  @IsOptional()
  @IsInt()
  @Min(1)
  returnWindowHours?: number;

  @ApiProperty({ required: false, enum: ClaimApprovalModeEnum })
  @IsOptional()
  @IsEnum(ClaimApprovalModeEnum)
  approvalMode?: ClaimApprovalMode;

  @ApiProperty({ required: false, enum: ClaimProofRequirementEnum })
  @IsOptional()
  @IsEnum(ClaimProofRequirementEnum)
  proofRequired?: ClaimProofRequirement;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  autoApproveBelowAmount?: number;

  @ApiProperty({ required: false, enum: ReturnClaimReasonEnum, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ReturnClaimReasonEnum, { each: true })
  returnReasons?: ReturnClaimReason[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  restockingFee?: number;

  @ApiProperty({ required: false, enum: ClaimRefundMethodEnum })
  @IsOptional()
  @IsEnum(ClaimRefundMethodEnum)
  refundMethod?: ClaimRefundMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  returnPolicyText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  replacementPolicyText?: string;

  @ApiProperty({ required: false, enum: PreparedFoodPolicyEnum })
  @IsOptional()
  @IsEnum(PreparedFoodPolicyEnum)
  preparedFoodPolicy?: PreparedFoodPolicy;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  allowCustomerChangedMind?: boolean;
}
