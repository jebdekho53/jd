import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export enum UploadImagePurpose {
  PRODUCT = 'product',
  STORE_LOGO = 'store-logo',
  STORE_BANNER = 'store-banner',
  CATEGORY = 'category',
}

export class UploadImageDto {
  @ApiProperty({ description: 'Base64 data URL (image/jpeg or image/png)' })
  @IsString()
  @MinLength(32)
  @MaxLength(5_000_000)
  dataUrl!: string;

  @ApiProperty({ enum: UploadImagePurpose })
  @IsEnum(UploadImagePurpose)
  purpose!: UploadImagePurpose;
}
