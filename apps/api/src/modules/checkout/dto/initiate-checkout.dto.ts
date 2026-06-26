import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

export class DeliveryAddressDto {
  @ApiProperty({ example: '42 MG Road' })
  @IsString()
  @Length(2, 200)
  line1: string;

  @ApiProperty({ required: false, example: 'Flat 3B' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: 'New Delhi' })
  @IsString()
  city: string;

  @ApiProperty({ example: '110001' })
  @IsString()
  @Length(4, 10)
  pincode: string;

  @ApiProperty({ example: 28.6139 })
  @IsLatitude()
  lat: number;

  @ApiProperty({ example: 77.209 })
  @IsLongitude()
  lng: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationPincodeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationAreaId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationCityId?: string;
}

export class InitiateCheckoutDto {
  @ApiProperty({ type: DeliveryAddressDto })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;

  @ApiProperty({ required: false, example: 'Please ring the bell' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  buyerNote?: string;

  @ApiProperty({ required: false, example: 50 })
  @IsOptional()
  @Type(() => Number)
  walletAmountToUse?: number;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @Type(() => Number)
  rewardPointsToRedeem?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @ApiProperty({ required: false, description: 'Approved corporate purchase request id' })
  @IsOptional()
  @IsString()
  corporatePurchaseRequestId?: string;
}
