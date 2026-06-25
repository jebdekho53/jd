import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  AudienceType,
  CampaignEventType,
  CampaignScope,
  CampaignStatus,
  OfferKind,
  OfferRuleType,
  OfferStackMode,
  PromotionTarget,
} from '@prisma/client';

export class OfferRuleDto {
  @IsEnum(OfferRuleType)
  ruleType!: OfferRuleType;

  @IsObject()
  config!: Record<string, unknown>;
}

export class CampaignAudienceDto {
  @IsEnum(AudienceType)
  audienceType!: AudienceType;

  @IsObject()
  config!: Record<string, unknown>;
}

export class CreateOfferDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(OfferKind)
  kind!: OfferKind;

  @IsOptional()
  @IsEnum(PromotionTarget)
  target?: PromotionTarget;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsNumber()
  @Min(0)
  discountValue!: number;

  @IsOptional()
  @IsNumber()
  cashbackAmount?: number;

  @IsOptional()
  @IsInt()
  rewardPointsBonus?: number;

  @IsOptional()
  @IsInt()
  buyQuantity?: number;

  @IsOptional()
  @IsInt()
  getQuantity?: number;

  @IsOptional()
  @IsNumber()
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @IsOptional()
  @IsInt()
  usageLimit?: number;

  @IsOptional()
  @IsInt()
  perUserLimit?: number;

  @IsOptional()
  @IsInt()
  flashQtyLimit?: number;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  expiresAt!: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OfferRuleDto)
  rules?: OfferRuleDto[];
}

export class CreateCampaignDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(OfferStackMode)
  stackMode?: OfferStackMode;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsNumber()
  budgetCap?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignAudienceDto)
  audiences?: CampaignAudienceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOfferDto)
  offers?: CreateOfferDto[];
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(OfferStackMode)
  stackMode?: OfferStackMode;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsNumber()
  budgetCap?: number;
}

export class ListCampaignsDto {
  @IsOptional()
  @IsEnum(CampaignScope)
  scope?: CampaignScope;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class TrackCampaignEventDto {
  @IsString()
  campaignId!: string;

  @IsOptional()
  @IsString()
  offerId?: string;

  @IsEnum(CampaignEventType)
  eventType!: CampaignEventType;
}
