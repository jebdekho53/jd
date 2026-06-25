import { ApiProperty } from '@nestjs/swagger';
import { StoreDocumentType } from '@prisma/client';
import { ArrayMinSize, IsArray, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestDocumentsDto {
  @ApiProperty({
    description: 'Message to merchant explaining what documents are needed',
    example: 'Please upload GST certificate, PAN card, and FSSAI license.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason!: string;

  @ApiProperty({
    enum: StoreDocumentType,
    isArray: true,
    example: [StoreDocumentType.GST_CERTIFICATE, StoreDocumentType.PAN_CARD],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(StoreDocumentType, { each: true })
  documentTypes!: StoreDocumentType[];
}
