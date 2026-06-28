import { ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ClaimApprovalMode,
  ClaimProofRequirement,
  ClaimRefundMethod,
  PreparedFoodPolicy,
  ReturnClaimReason,
} from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ClaimApprovalModeEnum,
  ClaimProofRequirementEnum,
  ClaimRefundMethodEnum,
  PreparedFoodPolicyEnum,
  ReturnClaimReasonEnum,
} from '../../../common/constants/claim-policy.enums';

export class ProductReturnPolicyDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isReturnable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRefundable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isReplaceable?: boolean;

  @ApiPropertyOptional({ description: 'Return window in hours' })
  @IsOptional()
  @IsInt()
  @Min(1)
  returnWindowHours?: number;

  @ApiPropertyOptional({ enum: ClaimApprovalModeEnum })
  @IsOptional()
  @IsEnum(ClaimApprovalModeEnum)
  approvalMode?: ClaimApprovalMode;

  @ApiPropertyOptional({ enum: ClaimProofRequirementEnum })
  @IsOptional()
  @IsEnum(ClaimProofRequirementEnum)
  proofRequired?: ClaimProofRequirement;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  autoApproveBelowAmount?: number;

  @ApiPropertyOptional({ enum: ReturnClaimReasonEnum, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ReturnClaimReasonEnum, { each: true })
  returnReasons?: ReturnClaimReason[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  restockingFee?: number;

  @ApiPropertyOptional({ enum: ClaimRefundMethodEnum })
  @IsOptional()
  @IsEnum(ClaimRefundMethodEnum)
  refundMethod?: ClaimRefundMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  returnPolicyText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  replacementPolicyText?: string;

  @ApiPropertyOptional({ enum: PreparedFoodPolicyEnum })
  @IsOptional()
  @IsEnum(PreparedFoodPolicyEnum)
  preparedFoodPolicy?: PreparedFoodPolicy;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowCustomerChangedMind?: boolean;
}

export class ApplyAiReturnPolicySuggestionDto extends ProductReturnPolicyDto {
  @ApiPropertyOptional({ description: 'Confirm applying AI-suggested policy' })
  @IsOptional()
  @IsBoolean()
  confirm?: boolean;
}
