import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FranchisePartnerStatus, CityLaunchStatus } from '@prisma/client';

export class CreateFranchiseDto {
  @IsString()
  userId!: string;

  @IsString()
  businessName!: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsNumber()
  commissionPercent?: number;
}

export class UpdateFranchiseDto {
  @IsOptional()
  status?: FranchisePartnerStatus;

  @IsOptional()
  @IsNumber()
  commissionPercent?: number;

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;
}

export class CreateCityLaunchDto {
  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsOptional()
  launchStatus?: CityLaunchStatus;

  @IsOptional()
  @IsNumber()
  targetStores?: number;

  @IsOptional()
  @IsNumber()
  targetRiders?: number;

  @IsOptional()
  @IsNumber()
  targetGmv?: number;
}

export class AssignTerritoryDto {
  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsArray()
  @IsString({ each: true })
  pincodes!: string[];

  @IsOptional()
  @IsBoolean()
  exclusivityEnabled?: boolean;
}

/** Public franchise application (unauthenticated funnel). */
export class SubmitFranchiseApplicationDto {
  @ApiProperty({ example: 'Rahul Seth' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: '+919876543210' })
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'Phone must be a valid Indian mobile number (+91XXXXXXXXXX)',
  })
  phone!: string;

  @ApiPropertyOptional({ example: 'rahul@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Ghaziabad' })
  @IsString()
  @Length(2, 120)
  city!: string;

  @ApiProperty({ example: 'Uttar Pradesh' })
  @IsString()
  @Length(2, 120)
  state!: string;

  /** Pincodes the applicant wants to cover. Fed to territory assignment on approval. */
  @ApiPropertyOptional({ example: ['201001', '201002'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @Matches(/^\d{6}$/, { each: true, message: 'Each pincode must be 6 digits' })
  pincodes?: string[];

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  investmentCapacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string;
}

export class ApproveExpansionLeadDto {
  /** Defaults to the lead's own requested pincodes. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @Matches(/^\d{6}$/, { each: true })
  pincodes?: string[];

  @IsOptional()
  @IsString()
  @Length(2, 200)
  businessName?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  /** Territory is exclusive by default — that is the locked business rule. */
  @IsOptional()
  @IsBoolean()
  exclusivityEnabled?: boolean;
}

export class RejectExpansionLeadDto {
  @IsString()
  @Length(3, 1000)
  reason!: string;
}
