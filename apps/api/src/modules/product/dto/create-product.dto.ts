import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

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

  @ApiProperty({ required: false, example: 'AMUL-MILK-500', description: 'Master SKU (optional)' })
  @IsOptional()
  @IsString()
  @Matches(SKU_REGEX, { message: 'SKU must be alphanumeric, dashes, or underscores' })
  sku?: string;

  @ApiProperty({ required: false, description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false, example: ['https://cdn.example.com/milk.png'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

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
}
