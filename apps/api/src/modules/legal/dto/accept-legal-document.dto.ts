import { ApiProperty } from '@nestjs/swagger';
import { LegalDocumentCode } from '@prisma/client';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export class AcceptLegalDocumentDto {
  @ApiProperty({ enum: LegalDocumentCode })
  @IsEnum(LegalDocumentCode)
  code!: LegalDocumentCode;

  /** The version the portal displayed. Validated against the registry server-side. */
  @ApiProperty({ example: 'v1' })
  @IsString()
  @MaxLength(20)
  version!: string;
}
