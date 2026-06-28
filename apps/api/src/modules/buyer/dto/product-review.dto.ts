import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export const MAX_REVIEW_IMAGES = 5;

export class CreateProductReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_REVIEW_IMAGES)
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  orderId?: string;
}

export class ListProductReviewsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
