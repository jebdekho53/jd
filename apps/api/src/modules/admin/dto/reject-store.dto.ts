import { ApiProperty } from '@nestjs/swagger';
import { RejectionType } from '@prisma/client';
import { IsEnum, IsString, Length } from 'class-validator';

export class RejectStoreDto {
  @ApiProperty({
    example: 'GST certificate is expired. Please upload a valid document.',
    description: 'Reason shown to the merchant',
  })
  @IsString()
  @Length(10, 500)
  reason!: string;

  @ApiProperty({
    enum: RejectionType,
    example: RejectionType.DOCUMENT_ISSUE,
    description:
      'DOCUMENT_ISSUE and COMPLIANCE_ISSUE are revocable. ' +
      'FRAUD, DUPLICATE_ACCOUNT, and POLICY_VIOLATION permanently blacklist the merchant.',
  })
  @IsEnum(RejectionType)
  rejectionType!: RejectionType;
}
