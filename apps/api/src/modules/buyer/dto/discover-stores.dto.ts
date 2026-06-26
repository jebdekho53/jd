import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { Transform } from 'class-transformer';

export type StoreDiscoverySort = 'distance' | 'popular' | 'fast' | 'new' | 'rating';

export class DiscoverStoresDto {
  @ApiProperty({ example: 28.6139, description: 'Buyer latitude (WGS-84)' })
  @Transform(({ value }) => parseFloat(value))
  @IsLatitude()
  lat: number;

  @ApiProperty({ example: 77.209, description: 'Buyer longitude (WGS-84)' })
  @Transform(({ value }) => parseFloat(value))
  @IsLongitude()
  lng: number;

  @ApiPropertyOptional({ example: '201206', description: 'Buyer pincode for delivery coverage' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  pincode?: string;

  @ApiProperty({
    required: false,
    example: 5,
    description: 'Search radius in km. Default 5, max 20.',
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.1)
  @Max(20)
  radiusKm?: number = 5;

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

  @ApiProperty({
    required: false,
    enum: ['distance', 'popular', 'fast', 'new', 'rating'],
    default: 'distance',
  })
  @IsOptional()
  @IsIn(['distance', 'popular', 'fast', 'new', 'rating'])
  sort?: StoreDiscoverySort = 'distance';
}
