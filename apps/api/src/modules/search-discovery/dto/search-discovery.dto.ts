import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export type SearchSort =
  | 'relevance'
  | 'distance'
  | 'price_low_high'
  | 'price_high_low'
  | 'rating'
  | 'fastest_delivery';

export type SearchTab = 'all' | 'products' | 'stores' | 'categories' | 'menu_items' | 'restaurants';

export class BuyerSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['relevance', 'distance', 'price_low_high', 'price_high_low', 'rating', 'fastest_delivery'] })
  @IsOptional()
  @IsIn(['relevance', 'distance', 'price_low_high', 'price_high_low', 'rating', 'fastest_delivery'])
  sort?: SearchSort;

  @ApiPropertyOptional({ enum: ['all', 'products', 'stores', 'categories', 'menu_items', 'restaurants'] })
  @IsOptional()
  @IsIn(['all', 'products', 'stores', 'categories', 'menu_items', 'restaurants'])
  tab?: SearchTab;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerProfileId?: string;
}

export class SearchSuggestionsDto {
  @IsString()
  q!: string;

  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsLongitude()
  lng?: number;
}

export class SearchTrendingDto {
  @IsOptional()
  @IsIn(['24h', '7d', '30d'])
  period?: '24h' | '7d' | '30d' = '7d';

  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsLongitude()
  lng?: number;
}

export type DiscoverStoreFilter =
  | 'nearest'
  | 'best_rated'
  | 'fast_delivery'
  | 'offers'
  | 'new_stores';

export class DiscoverStoresSearchDto {
  @Transform(({ value }) => parseFloat(value))
  @IsLatitude()
  lat!: number;

  @Transform(({ value }) => parseFloat(value))
  @IsLongitude()
  lng!: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.1)
  @Max(20)
  radiusKm?: number = 10;

  @ApiPropertyOptional({ example: '201017' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  pincode?: string;

  @IsOptional()
  @IsIn(['nearest', 'best_rated', 'fast_delivery', 'offers', 'new_stores'])
  filter?: DiscoverStoreFilter = 'nearest';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class DiscoverHomeDto {
  @Transform(({ value }) => parseFloat(value))
  @IsLatitude()
  lat!: number;

  @Transform(({ value }) => parseFloat(value))
  @IsLongitude()
  lng!: number;

  @IsOptional()
  @IsString()
  buyerProfileId?: string;
}

export class TrackSearchEventDto {
  @IsIn(['QUERY', 'CLICK', 'ADD_TO_CART', 'STORE_CLICK', 'IMPRESSION'])
  eventType!: 'QUERY' | 'CLICK' | 'ADD_TO_CART' | 'STORE_CLICK' | 'IMPRESSION';

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  buyerProfileId?: string;
}
