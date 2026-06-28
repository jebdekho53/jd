import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class InitiateFoodCheckoutDto {
  @ApiProperty()
  @IsObject()
  deliveryAddress!: Record<string, unknown>;

  @ApiProperty()
  @IsNumber()
  deliveryLat!: number;

  @ApiProperty()
  @IsNumber()
  deliveryLng!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  tipAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  couponDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduledDeliveryAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  restaurantNote?: string;
}
