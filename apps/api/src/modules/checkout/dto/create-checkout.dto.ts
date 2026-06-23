import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'Saved address ID to deliver to' })
  @IsString()
  deliveryAddressId: string;

  @ApiProperty({ required: false, description: 'Optional note to merchant' })
  @IsOptional()
  @IsString()
  buyerNote?: string;
}
