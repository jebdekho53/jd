import { IsBoolean, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
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
