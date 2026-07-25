import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class SelfDeliveryFeeTierDto {
  @ApiProperty({ example: 0, description: 'Inclusive lower bound of this band, in km' })
  @IsNumber()
  @Min(0)
  minKm: number;

  @ApiPropertyOptional({ example: 3, description: 'Exclusive upper bound in km; omit/null for the farthest band' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxKm?: number | null;

  @ApiProperty({ example: 20, description: 'Fee in rupees for deliveries in this band' })
  @IsNumber()
  @Min(0)
  fee: number;
}
