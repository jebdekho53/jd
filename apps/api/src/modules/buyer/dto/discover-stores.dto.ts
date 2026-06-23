import { ApiProperty } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class DiscoverStoresDto {
  @ApiProperty({ example: 28.6139, description: 'Buyer latitude (WGS-84)' })
  @Transform(({ value }) => parseFloat(value))
  @IsLatitude()
  lat: number;

  @ApiProperty({ example: 77.209, description: 'Buyer longitude (WGS-84)' })
  @Transform(({ value }) => parseFloat(value))
  @IsLongitude()
  lng: number;

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
}
