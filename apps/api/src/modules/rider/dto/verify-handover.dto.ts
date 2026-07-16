import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumberString, IsOptional, Length } from 'class-validator';

export class VerifyPickupDto {
  @ApiProperty({ example: '4821', description: 'Handover code shown to the merchant' })
  @IsNotEmpty()
  @IsNumberString()
  @Length(4, 6)
  otp!: string;
}

export class VerifyDeliveryDto {
  @ApiProperty({ example: '7390', description: 'Delivery code read out by the customer' })
  @IsNotEmpty()
  @IsNumberString()
  @Length(4, 6)
  otp!: string;

  @ApiProperty({
    required: false,
    default: false,
    description:
      'Rider acknowledgment that the cash-on-delivery amount was collected. Required for COD orders; the amount itself is taken from the server, never the client.',
  })
  @IsOptional()
  @IsBoolean()
  codCollected?: boolean;
}
