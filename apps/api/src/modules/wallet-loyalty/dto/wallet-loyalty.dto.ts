import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ApplyReferralDto {
  @ApiProperty()
  @IsString()
  @Length(4, 20)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class CheckoutWalletDto {
  @ApiPropertyOptional({ description: 'Amount to pay from wallet' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  walletAmountToUse?: number;

  @ApiPropertyOptional({ description: 'Reward points to redeem' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rewardPointsToRedeem?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class AdminAdjustWalletDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @ApiProperty()
  @IsString()
  reason!: string;
}

export class AdminAdjustPointsDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  points!: number;

  @ApiProperty()
  @IsString()
  reason!: string;
}

export class UpdateRewardConfigDto {
  @ApiProperty()
  value!: Record<string, unknown>;
}

export class ResolveFraudReviewDto {
  @ApiProperty()
  approve!: boolean;
}
