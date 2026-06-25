import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressLabel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ALLOWED_DELIVERY_RADII_KM } from '../../../common/utils/geospatial.util';

export class MapStoresQueryDto {
  @ApiProperty({ example: 28.6139 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ example: 77.209 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(25)
  radiusKm?: number;
}

export class CheckDeliverabilityDto {
  @ApiProperty()
  @IsString()
  storeId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

export class UpdateStoreRadiusDto {
  @ApiProperty({ enum: ALLOWED_DELIVERY_RADII_KM })
  @Type(() => Number)
  @IsIn(ALLOWED_DELIVERY_RADII_KM as unknown as number[])
  deliveryRadiusKm!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locality?: string;
}

export class CreateAddressDto {
  @ApiPropertyOptional({ enum: AddressLabel })
  @IsOptional()
  @IsEnum(AddressLabel)
  label?: AddressLabel;

  @ApiProperty()
  @IsString()
  line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty()
  @IsString()
  state!: string;

  @ApiProperty()
  @IsString()
  pincode!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ enum: AddressLabel })
  @IsOptional()
  @IsEnum(AddressLabel)
  label?: AddressLabel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
