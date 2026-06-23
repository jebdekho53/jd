import { ApiProperty } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
}
