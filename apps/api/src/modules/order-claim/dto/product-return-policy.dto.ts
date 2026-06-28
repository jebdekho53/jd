import { ApiPropertyOptional } from '@nestjs/swagger';
import {
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

  @ApiPropertyOptional({ enum: ClaimApprovalMode })
  @IsOptional()
  @IsEnum(ClaimApprovalMode)
  approvalMode?: ClaimApprovalMode;

  @ApiPropertyOptional({ enum: ClaimProofRequirement })
  @IsOptional()
  @IsEnum(ClaimProofRequirement)
  proofRequired?: ClaimProofRequirement;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  autoApproveBelowAmount?: number;

  @ApiPropertyOptional({ enum: ReturnClaimReason, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ReturnClaimReason, { each: true })
  returnReasons?: ReturnClaimReason[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  restockingFee?: number;

  @ApiPropertyOptional({ enum: ClaimRefundMethod })
  @IsOptional()
  @IsEnum(ClaimRefundMethod)
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

  @ApiPropertyOptional({ enum: PreparedFoodPolicy })
  @IsOptional()
  @IsEnum(PreparedFoodPolicy)
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
