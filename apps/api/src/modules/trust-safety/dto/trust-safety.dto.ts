import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FraudCaseCategory, RiskProfileStatus } from '@prisma/client';

export class ListTrustQueryDto {
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

  @IsOptional()
  @IsEnum(FraudCaseCategory)
  category?: FraudCaseCategory;

  @IsOptional()
  @IsEnum(RiskProfileStatus)
  status?: RiskProfileStatus;
}

const TRUST_ACTIONS = [
  'approve',
  'reject',
  'warn',
  'restrict',
  'suspend',
  'blacklist',
  'wallet_freeze',
  'referral_freeze',
  'coupon_freeze',
  'cod_disable',
  'merchant_suspend',
  'rider_suspend',
  'soft_block',
] as const;

export class AdminTrustActionDto {
  @IsString()
  userId: string;

  @IsEnum(TRUST_ACTIONS)
  action: (typeof TRUST_ACTIONS)[number];

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  caseId?: string;
}

export class EnableCodDto {
  @IsString()
  userId: string;
}
