import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  OrderClaimStatus,
  OrderClaimType,
  ReturnClaimReason,
} from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  OrderClaimStatusEnum,
  OrderClaimTypeEnum,
  ReturnClaimReasonEnum,
} from '../../../common/constants/claim-policy.enums';

export class ClaimItemDto {
  @ApiProperty()
  @IsString()
  orderItemId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class ClaimEvidenceDto {
  @ApiProperty({ enum: ['PHOTO', 'VIDEO'] })
  @IsIn(['PHOTO', 'VIDEO'])
  kind: 'PHOTO' | 'VIDEO';

  @ApiProperty()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  url: string;
}

export class CreateOrderClaimDto {
  @ApiProperty({ enum: OrderClaimTypeEnum })
  @IsEnum(OrderClaimTypeEnum)
  claimType: OrderClaimType;

  @ApiProperty({ enum: ReturnClaimReasonEnum })
  @IsEnum(ReturnClaimReasonEnum)
  reason: ReturnClaimReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  reasonNote?: string;

  @ApiProperty({ type: [ClaimItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClaimItemDto)
  items: ClaimItemDto[];

  @ApiPropertyOptional({ type: [ClaimEvidenceDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => ClaimEvidenceDto)
  evidence?: ClaimEvidenceDto[];

  @ApiPropertyOptional({ description: 'Client idempotency key to prevent duplicate claims' })
  @IsOptional()
  @IsString()
  @Length(8, 128)
  idempotencyKey?: string;
}

export class ListMerchantClaimsDto {
  @ApiPropertyOptional({ enum: OrderClaimStatusEnum })
  @IsOptional()
  @IsEnum(OrderClaimStatusEnum)
  status?: OrderClaimStatus;

  @ApiPropertyOptional({ enum: OrderClaimTypeEnum })
  @IsOptional()
  @IsEnum(OrderClaimTypeEnum)
  claimType?: OrderClaimType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class PatchMerchantClaimDto {
  @ApiProperty({
    enum: [
      'APPROVE',
      'REJECT',
      'REQUEST_EVIDENCE',
      'APPROVE_REPLACEMENT',
      'APPROVE_REFUND',
      'ISSUE_REPLACEMENT',
    ],
  })
  @IsString()
  action:
    | 'APPROVE'
    | 'REJECT'
    | 'REQUEST_EVIDENCE'
    | 'APPROVE_REPLACEMENT'
    | 'APPROVE_REFUND'
    | 'ISSUE_REPLACEMENT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  note?: string;

  @ApiPropertyOptional({ description: 'Approved refund amount (defaults to requested)' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  approvedAmount?: number;

  @ApiPropertyOptional({ description: 'Enable return pickup via logistics' })
  @IsOptional()
  returnPickupEnabled?: boolean;
}

export class PatchAdminClaimDto extends PatchMerchantClaimDto {
  @ApiPropertyOptional({ enum: ['FORCE_REFUND', 'SUSPEND_MERCHANT'] })
  @IsOptional()
  @IsString()
  adminAction?: 'FORCE_REFUND' | 'SUSPEND_MERCHANT';
}
