import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  MerchantBusinessType,
  MerchantDocumentType,
  MerchantOnboardingStepKey,
  VerticalBusinessType,
} from '@prisma/client';
import { PHONE_E164_REGEX } from '../../../common/constants';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class ResolveStoreLocationDto {
  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @ValidateIf((o) => o.pincode != null)
  @Matches(/^\d{6}$/)
  pincode?: string;

  @ApiProperty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationCityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationAreaId?: string;
}

export class PickupAddressDto {
  @ApiProperty()
  @IsString()
  @Length(8, 200)
  addressLine1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  addressLine2?: string;

  @ApiProperty()
  @IsString()
  @Length(2, 120)
  locality: string;

  @ApiProperty()
  @IsString()
  @Length(3, 120)
  landmark: string;

  @ApiProperty()
  @IsString()
  @Length(2, 100)
  city: string;

  @ApiProperty()
  @IsString()
  @Length(2, 100)
  state: string;

  @ApiProperty()
  @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits' })
  pincode: string;

  @ApiProperty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 300)
  pickupInstructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googlePlaceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  formattedAddress?: string;
}

export class UpdateOnboardingStepDto {
  @ApiProperty({ enum: MerchantOnboardingStepKey })
  @IsEnum(MerchantOnboardingStepKey)
  stepKey: MerchantOnboardingStepKey;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  ownerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(PHONE_E164_REGEX, { message: 'Phone must be in E.164 format' })
  ownerPhone?: string;

  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsString()
  @Length(8, 72)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 150)
  businessName?: string;

  @ApiPropertyOptional({ enum: MerchantBusinessType })
  @IsOptional()
  @IsEnum(MerchantBusinessType)
  businessType?: MerchantBusinessType;

  @ApiPropertyOptional({ type: [String], description: 'Multiple business verticals (super-app)' })
  @IsOptional()
  @IsArray()
  @IsEnum(MerchantBusinessType, { each: true })
  businessTypes?: MerchantBusinessType[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(15, 15)
  gstNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN format' })
  panNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  storeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(5, 500)
  storeAddress?: string;

  @ApiPropertyOptional({ type: PickupAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PickupAddressDto)
  pickupAddress?: PickupAddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(6, 6)
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationPincodeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationAreaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationCityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  deliveryRadiusKm?: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.jpg' })
  @IsOptional()
  @IsUrl()
  storeLogoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/banner.jpg' })
  @IsOptional()
  @IsUrl()
  storeBannerUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ['201206', '201204'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliveryCoveragePincodes?: string[];
}

export class UploadMerchantDocumentDto {
  @ApiProperty({ enum: MerchantDocumentType })
  @IsEnum(MerchantDocumentType)
  documentType: MerchantDocumentType;

  @ApiProperty()
  @IsString()
  @Length(1, 255)
  fileName: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  mimeType: string;

  @ApiProperty({ description: 'Base64 data URL or hosted file URL' })
  @IsString()
  @Length(10, 5_000_000)
  fileUrl: string;
}

export class SaveBankAccountDto {
  @ApiProperty()
  @IsString()
  @Length(2, 100)
  accountHolderName: string;

  @ApiProperty()
  @IsString()
  @Length(8, 20)
  accountNumber: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC format' })
  ifsc: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 100)
  upiId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;
}

export class ValidateGstDto {
  @ApiProperty()
  @IsString()
  @Length(15, 15)
  gstNumber: string;
}

export class FranchiseLeadDto {
  @ApiProperty()
  @IsString()
  @Length(2, 100)
  contactName: string;

  @ApiProperty()
  @IsString()
  @Length(2, 100)
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}

export class ListMerchantApplicationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class RejectApplicationDto {
  @ApiProperty()
  @IsString()
  @Length(5, 1000)
  reason: string;
}

export class RequestApplicationDocumentsDto {
  @ApiProperty()
  @IsString()
  @Length(5, 1000)
  reason: string;

  @ApiProperty({ type: [String], enum: MerchantDocumentType })
  @IsEnum(MerchantDocumentType, { each: true })
  documentTypes: MerchantDocumentType[];
}

export class RequestApplicationChangesDto {
  @ApiProperty()
  @IsString()
  @Length(5, 1000)
  message: string;
}

export class ScheduleCallDto {
  @ApiProperty()
  @IsString()
  @Length(5, 500)
  notes: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduledAt?: string;
}
