import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export class CreateMerchantProfileDto {
  @ApiProperty({ example: 'Sharma General Store' })
  @IsString()
  @Length(2, 100)
  businessName: string;

  @ApiProperty({ required: false, example: '07AAGCR2206E1ZN' })
  @IsOptional()
  @Matches(GST_REGEX, { message: 'Invalid GST number format' })
  gstNumber?: string;

  @ApiProperty({ required: false, example: 'AAGCR2206E' })
  @IsOptional()
  @Matches(PAN_REGEX, { message: 'Invalid PAN number format' })
  panNumber?: string;
}
