import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsLatitude, IsLongitude, IsOptional, IsString, Length } from 'class-validator';

export class CompareProductDto {
  @ApiProperty({ required: false, description: 'Buyer latitude for distance and ETA' })
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsLatitude()
  lat?: number;

  @ApiProperty({ required: false, description: 'Buyer longitude for distance and ETA' })
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : undefined))
  @IsLongitude()
  lng?: number;

  @ApiProperty({ required: false, example: '201017' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  pincode?: string;
}
