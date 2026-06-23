import { ApiProperty } from '@nestjs/swagger';
import {
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

  @ApiProperty({ required: false, description: 'Narrow results to a specific store' })
  @IsOptional()
  @IsString()
  storeId?: string;

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
