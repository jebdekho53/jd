import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RejectStoreDto {
  @ApiProperty({
    example: 'GST number is invalid. Please provide a valid GSTIN.',
    description: 'Reason shown to the merchant',
  })
  @IsString()
  @Length(10, 500)
  reason: string;
}
