import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class MerchantDashboardStoreQueryDto {
  @ApiPropertyOptional({ description: 'Filter metrics to a single store' })
  @IsOptional()
  @IsString()
  storeId?: string;
}

export class MerchantDashboardOrdersQueryDto extends MerchantDashboardStoreQueryDto {
  @ApiPropertyOptional({
    description: 'Order status tab',
    enum: [
      'NEW',
      'ACTIVE',
      'ACCEPTED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'RIDER_ASSIGNED',
      'OUT_FOR_DELIVERY',
      'CANCELLED',
    ],
  })
  @IsOptional()
  @IsString()
  tab?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class MerchantDashboardAnalyticsQueryDto extends MerchantDashboardStoreQueryDto {
  @ApiPropertyOptional({ enum: ['7d', '30d'], default: '7d' })
  @IsOptional()
  @IsString()
  period?: '7d' | '30d' = '7d';
}
