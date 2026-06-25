import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStoreReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  storeExperience!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  deliveryExperience!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  productQuality!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  review?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  images?: string[];
}

export class UpdateStoreReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  storeExperience?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  deliveryExperience?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  productQuality?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  review?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  images?: string[];
}

export class MerchantReplyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reply!: string;
}

export class ReportReviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

export class ModerateReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class ListStoreReviewsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  q?: string;
}
