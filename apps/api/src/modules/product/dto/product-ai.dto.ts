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

export class AnalyzeProductImageDto {
  @ApiProperty({ description: 'Base64 data URL of product photo (JPEG/PNG/WebP, max 5MB)' })
  @IsString()
  @Length(32, 7_000_000)
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

  @ApiProperty({ description: 'Publish immediately (true) or save as draft (false)' })
  @IsBoolean()
  publish!: boolean;
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
