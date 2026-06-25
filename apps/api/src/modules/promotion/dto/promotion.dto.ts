import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CouponKind,
  CouponScope,
  CouponType,
  OfferSponsor,
  PromotionOfferType,
  PromotionTarget,
} from '@prisma/client';

export class ApplyCouponDto {
  @IsString()
  @MinLength(2)
  code!: string;
}

export class CreateStorePromotionDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PromotionOfferType)
  offerType!: PromotionOfferType;

  @IsEnum(PromotionTarget)
  target!: PromotionTarget;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  buyQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  getQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  expiresAt!: string;
}

export class UpdateStorePromotionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCouponDto {
  @IsString()
  @MinLength(3)
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CouponType)
  type!: CouponType;

  @IsOptional()
  @IsEnum(CouponKind)
  kind?: CouponKind;

  @IsEnum(CouponScope)
  scope!: CouponScope;

  @IsOptional()
  @IsEnum(OfferSponsor)
  sponsor?: OfferSponsor;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @IsOptional()
  @IsBoolean()
  firstOrderOnly?: boolean;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  expiresAt!: string;
}

export class ListPromotionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'paused' | 'expired' | 'all';
}

export class MerchantReplyDto {
  @IsString()
  @MinLength(1)
  reply!: string;
}

export class ListAdminPromotionsDto extends ListPromotionsDto {
  @IsOptional()
  @IsString()
  storeId?: string;
}
