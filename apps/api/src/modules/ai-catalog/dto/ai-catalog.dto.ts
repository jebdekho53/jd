import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ALL_IMAGE_OUTPUTS } from '../ai-catalog.constants';

const MAX_DATA_URL = 12_000_000; // ~8MB base64

export class QueueAnalysisDto {
  @ApiProperty({ description: 'Base64 data URL (JPEG/PNG/WebP, max 8MB)' })
  @IsString()
  @Length(32, MAX_DATA_URL)
  dataUrl!: string;

  @ApiPropertyOptional({ description: 'Auto-queue default image outputs after analysis', default: true })
  @IsOptional()
  @IsBoolean()
  autoGenerateImages?: boolean;
}

export class GenerateImagesDto {
  @ApiProperty({ isArray: true, enum: ALL_IMAGE_OUTPUTS })
  @IsArray()
  @ArrayMaxSize(8)
  @IsIn(ALL_IMAGE_OUTPUTS, { each: true })
  outputTypes!: string[];

  @ApiPropertyOptional({ description: 'Force a fresh version even if a cached identical image exists' })
  @IsOptional()
  @IsBoolean()
  forceRegenerate?: boolean;
}

export class AttributeApprovalDto {
  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty()
  @IsBoolean()
  approved!: boolean;

  @ApiPropertyOptional({ description: 'Merchant-edited value (overrides AI value)' })
  @IsOptional()
  value?: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitKey?: string;
}

export class ConfirmCatalogDto {
  @ApiProperty()
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 4000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ description: 'Chosen category id (must be a returned candidate or eligible category)' })
  @IsString()
  categoryId!: string;

  @ApiProperty({ description: 'Selling price in rupees' })
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional({ description: 'MRP in rupees' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp?: number;

  @ApiPropertyOptional({ default: 'piece' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Opening stock', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ isArray: true, type: String })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Selected image asset id to use as primary' })
  @IsOptional()
  @IsString()
  primaryImageAssetId?: string;

  @ApiPropertyOptional({ default: false, description: 'Publish immediately vs save as draft' })
  @IsOptional()
  @IsBoolean()
  publish?: boolean;

  @ApiPropertyOptional({ isArray: true, type: AttributeApprovalDto })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(80)
  @ValidateNested({ each: true })
  @Type(() => AttributeApprovalDto)
  attributes?: AttributeApprovalDto[];

  @ApiPropertyOptional({ description: 'Merchant acknowledged supplement/regulatory review' })
  @IsOptional()
  @IsBoolean()
  complianceConfirmed?: boolean;
}

export class ImageActionDto {
  @ApiProperty({ enum: ['approve', 'reject', 'select'] })
  @IsIn(['approve', 'reject', 'select'])
  action!: 'approve' | 'reject' | 'select';
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export class SetConfigDto {
  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty({ description: 'JSON value (boolean, number, object, array…)' })
  value!: unknown;
}

export class CreatePromptVersionDto {
  @ApiProperty({ description: 'e.g. "vision" or "image:hero"' })
  @IsString()
  kind!: string;

  @ApiProperty()
  @IsString()
  @Length(10, 20000)
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ModerationDecisionDto {
  @ApiProperty()
  @IsBoolean()
  approve!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdminRefundDto {
  @ApiProperty()
  @IsString()
  merchantProfileId!: string;

  @ApiProperty()
  @IsString()
  imageAssetId!: string;

  @ApiProperty()
  @IsString()
  reason!: string;
}
