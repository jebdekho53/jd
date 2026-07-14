import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FranchisePartnerStatus, CityLaunchStatus, FranchiseDocumentType } from '@prisma/client';

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

  /**
   * Required: the portal's password login resolves the account BY EMAIL, so a partner
   * with no email could never use the password tab.
   */
  @ApiProperty({ example: 'rahul@example.com' })
  @IsEmail()
  email!: string;

  /**
   * The applicant chooses their portal password up front. Hashed (argon2) onto the
   * lead immediately and only ever copied onto a brand-new account at approval.
   */
  @ApiProperty({ example: 'S3cure!pass', minLength: 8 })
  @IsString()
  @Length(8, 128)
  password!: string;

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

export class GenerateFranchiseSettlementsDto {
  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @IsOptional()
  @IsString()
  franchiseId?: string;
}

/** Partner's payout bank account. Editing it always resets verification. */
export class SaveFranchiseBankAccountDto {
  @ApiProperty({ example: 'Rahul Seth' })
  @IsString()
  @Length(2, 120)
  accountHolderName!: string;

  @ApiProperty({ example: '50100123456789' })
  @Matches(/^\d{6,20}$/, { message: 'Account number must be 6-20 digits' })
  accountNumber!: string;

  @ApiProperty({ example: 'HDFC0001234' })
  @Matches(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, { message: 'IFSC is not valid' })
  ifsc!: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  bankName?: string;

  @ApiPropertyOptional({ example: 'rahul@upi' })
  @IsOptional()
  @IsString()
  @Length(0, 120)
  upiId?: string;
}

export class UploadFranchiseDocumentDto {
  @ApiProperty({ enum: FranchiseDocumentType, example: FranchiseDocumentType.PAN_CARD })
  @IsEnum(FranchiseDocumentType)
  documentType!: FranchiseDocumentType;

  @ApiProperty({ example: 'pan.pdf' })
  @IsString()
  @Length(1, 200)
  fileName!: string;

  @ApiProperty({ example: 'https://jebdekho.com/uploads/franchise-document/abc.pdf' })
  @IsString()
  @Length(1, 2000)
  fileUrl!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @Length(1, 120)
  mimeType!: string;
}

export class AcceptFranchiseAgreementDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  accepted!: boolean;
}

export class RejectFranchiseDocumentDto {
  @ApiProperty({ example: 'The PAN card image is unreadable.' })
  @IsString()
  @Length(3, 1000)
  reason!: string;
}
