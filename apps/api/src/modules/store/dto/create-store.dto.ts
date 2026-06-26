import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PHONE_E164_REGEX } from '../../../common/constants';
import { StoreHourDto } from './store-hours.dto';

export class CreateStoreDto {
  @ApiProperty({ example: 'Sharma General Store' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ required: false, example: 'Fresh groceries delivered in 10 minutes' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiProperty({ example: '+919876543210' })
  @Matches(PHONE_E164_REGEX, { message: 'Phone must be in E.164 format' })
  phone: string;

  @ApiProperty({ example: 'store@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '42, Hauz Khas Village' })
  @IsString()
  @Length(5, 200)
  line1: string;

  @ApiProperty({ required: false, example: 'Near Metro Gate 3' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  line2?: string;

  @ApiProperty({ example: '110016' })
  @IsString()
  @Length(6, 6, { message: 'Pincode must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits' })
  pincode: string;

  @ApiProperty({ example: 28.5494, description: 'Store latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 77.1855, description: 'Store longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 'city-cuid', description: 'City ID from /cities' })
  @IsString()
  cityId: string;

  @ApiProperty({ required: false, example: 'loc-city-cuid' })
  @IsOptional()
  @IsString()
  locationCityId?: string;

  @ApiProperty({ required: false, example: 'loc-area-cuid' })
  @IsOptional()
  @IsString()
  locationAreaId?: string;

  @ApiProperty({ required: false, example: 'loc-pincode-cuid' })
  @IsOptional()
  @IsString()
  locationPincodeId?: string;

  @ApiProperty({ example: 'https://cdn.example.com/logo.jpg' })
  @IsUrl()
  logoUrl!: string;

  @ApiProperty({ example: 'https://cdn.example.com/banner.jpg' })
  @IsUrl()
  bannerUrl!: string;

  @ApiProperty({ required: false, example: 99, description: 'Minimum order amount in INR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiProperty({ required: false, example: 29, description: 'Delivery fee in INR (0 = free)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @ApiProperty({ required: false, example: 15, description: 'Average prep time in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  avgPrepTimeMins?: number;

  @ApiProperty({ required: false, type: [String], description: 'Zone IDs to serve' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  zoneIds?: string[];

  @ApiProperty({ required: false, type: [String], description: 'Service area IDs (fine-grained)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceAreaIds?: string[];

  @ApiProperty({ required: false, type: [StoreHourDto], description: 'Weekly operating hours' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreHourDto)
  hours?: StoreHourDto[];

  @ApiProperty({ required: false, type: [String], description: 'Additional delivery coverage pincodes' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliveryCoveragePincodes?: string[];
}
