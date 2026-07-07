import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
  IsArray,
} from 'class-validator';
import { GstSlab } from '@prisma/client';

const MAX_AI_IMAGE_DATA_URL_LENGTH = 7_100_000;

export class AnalyzeProductImageDto {
  @ApiProperty({ description: 'Base64 data URL of product photo (JPEG/PNG/WebP, max 5MB)' })
  @IsString()
  @Length(32, MAX_AI_IMAGE_DATA_URL_LENGTH)
  dataUrl!: string;
}

export class ConfirmAiProductDto {
  @ApiProperty({ example: 'Amul Full Cream Milk' })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 49 })
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ingredients?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shelfLife?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fssaiLicense?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageInstructions?: string;

  @ApiProperty({ description: 'Required HSN code reference ID for GST compliance and logistics' })
  @IsString()
  @IsNotEmpty()
  hsnCodeId!: string;

  @ApiPropertyOptional({ enum: GstSlab })
  @IsOptional()
  @IsEnum(GstSlab)
  gstSlab?: GstSlab;

  @ApiPropertyOptional({ enum: ['GOODS', 'SERVICES', 'EXEMPT', 'NIL_RATED'] })
  @IsOptional()
  @IsEnum(['GOODS', 'SERVICES', 'EXEMPT', 'NIL_RATED'])
  taxCategory?: 'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED';

  @ApiPropertyOptional({
    description: 'Apply AI-suggested return policy (merchant must opt in)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  confirmReturnPolicy?: boolean;

  @ApiPropertyOptional({
    description: 'Optional image URL to use as the product photo (e.g. an AI-generated image from this analysis)',
  })
  @IsOptional()
  @IsString()
  primaryImageUrl?: string;

  @ApiPropertyOptional({
    description:
      'Merchant attests they have verified ingredients, FSSAI and compliance details. Required to publish a supplement whose label could not be auto-read.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  supplementComplianceConfirmed?: boolean;

  // --- Inventory / compliance extras (merchant-editable in the AI modal) ---
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturerAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  disclaimer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  // --- Return / refund / replacement policy (kept as loose types here and
  // normalized in the service so a stray value can never 400 the whole save) ---
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isReturnable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRefundable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isReplaceable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  returnWindowHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvalMode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proofRequired?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refundMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowCustomerChangedMind?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  returnPolicyText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  replacementPolicyText?: string;

  @ApiProperty({ description: 'Publish immediately (true) or save as draft (false)' })
  @IsBoolean()
  publish!: boolean;
}

export class GenerateProductImageDto {
  @ApiPropertyOptional({
    enum: ['bg_removal', 'ai_edit'],
    default: 'bg_removal',
    description: 'bg_removal = clean the uploaded photo background (keeps label); ai_edit = regenerate via AI',
  })
  @IsOptional()
  @IsEnum(['bg_removal', 'ai_edit'])
  mode?: 'bg_removal' | 'ai_edit';
}

export class ListAiHistoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
