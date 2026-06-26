import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchProductsDto {
  @ApiProperty({ required: false, example: 'amul milk', description: 'Search term' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  q?: string;

  @ApiProperty({ required: false, description: 'Narrow results to a category' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false, description: 'Narrow results to a subcategory' })
  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @ApiProperty({ required: false, description: 'Narrow results to a specific store' })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsLatitude()
  lat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsLongitude()
  lng?: number;

  @ApiProperty({ required: false, example: '201017', description: 'Buyer pincode for delivery coverage' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  pincode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsNumber()
  maxPrice?: number;

  @ApiProperty({
    required: false,
    enum: ['relevance', 'distance', 'price_low_high', 'price_high_low', 'rating', 'fastest_delivery'],
  })
  @IsOptional()
  @IsIn(['relevance', 'distance', 'price_low_high', 'price_high_low', 'rating', 'fastest_delivery'])
  sort?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
