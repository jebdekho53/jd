import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

/** Where a document is filed. Doubles as the storage folder. */
export enum UploadDocumentPurpose {
  FRANCHISE_DOCUMENT = 'franchise-document',
}

export class UploadDocumentDto {
  @ApiProperty({ description: 'Base64 data URL (application/pdf, image/jpeg, image/png, image/webp)' })
  @IsString()
  @MinLength(32)
  // ~8 MB of bytes becomes ~11 MB of base64.
  @MaxLength(11_000_000)
  dataUrl!: string;

  @ApiProperty({ enum: UploadDocumentPurpose })
  @IsEnum(UploadDocumentPurpose)
  purpose!: UploadDocumentPurpose;
}
