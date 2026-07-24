import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorType } from '@prisma/client';

export class SubmitVendorApplicationDto {
  @ApiProperty({ example: 'Sharma Wholesale Traders' })
  @IsString()
  @Length(2, 200)
  businessName!: string;

  @ApiProperty({ enum: VendorType })
  @IsEnum(VendorType)
  vendorType!: VendorType;

  @ApiProperty({ example: '+919876543210' })
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'Phone must be a valid Indian mobile number (+91XXXXXXXXXX)',
  })
  phone!: string;

  /** Required: the portal's password login resolves the account BY EMAIL, same
   *  reasoning as franchise onboarding. */
  @ApiProperty({ example: 'vendor@example.com' })
  @IsEmail()
  email!: string;

  /** Chosen up front, hashed immediately, only ever copied onto a brand-new
   *  account at approval — never onto a reused/existing one. */
  @ApiProperty({ example: 'S3cure!pass', minLength: 8 })
  @IsString()
  @Length(8, 128)
  password!: string;

  @ApiPropertyOptional({ example: 'Ghaziabad' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  cityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  line1?: string;

  @ApiPropertyOptional({ example: '201001' })
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits' })
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 20)
  gstNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 20)
  panNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string;
}

export class ApproveVendorApplicationDto {
  @ApiPropertyOptional({ example: 'Sharma Wholesale Traders Pvt Ltd' })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  businessName?: string;
}

export class RejectVendorApplicationDto {
  @ApiProperty({ example: 'GST number could not be verified' })
  @IsString()
  @Length(3, 1000)
  reason!: string;
}
