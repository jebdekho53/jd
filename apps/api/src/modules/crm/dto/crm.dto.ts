import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MarketingEventType } from '@prisma/client';

export class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class TrackEventDto {
  @IsEnum(MarketingEventType)
  eventType: MarketingEventType;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdatePreferencesDto {
  @IsOptional()
  pushEnabled?: boolean;

  @IsOptional()
  emailEnabled?: boolean;

  @IsOptional()
  smsEnabled?: boolean;

  @IsOptional()
  whatsappEnabled?: boolean;

  @IsOptional()
  marketingConsent?: boolean;

  @IsOptional()
  orderUpdates?: boolean;

  @IsOptional()
  walletAlerts?: boolean;

  @IsOptional()
  offerAlerts?: boolean;

  @IsOptional()
  referralAlerts?: boolean;

  @IsOptional()
  supportAlerts?: boolean;

  @IsOptional()
  complianceAlerts?: boolean;
}

export class CreatePushCampaignDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  segmentId?: string;

  @IsString()
  templateCode: string;
}
