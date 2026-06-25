import { ApiProperty } from '@nestjs/swagger';
import { StoreDocumentType } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class UploadVerificationDocumentDto {
  @ApiProperty({ enum: StoreDocumentType })
  @IsEnum(StoreDocumentType)
  documentType!: StoreDocumentType;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ description: 'MIME type, e.g. image/jpeg or application/pdf' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  mimeType!: string;

  @ApiProperty({ description: 'Base64 data URL or file URL' })
  @IsString()
  @MinLength(10)
  @MaxLength(5_000_000)
  fileUrl!: string;
}
