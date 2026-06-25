import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsSalesQueryDto {
  @ApiPropertyOptional({ enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'] })
  @IsOptional()
  @IsIn(['hourly', 'daily', 'weekly', 'monthly', 'yearly'])
  granularity?: string;

  @ApiPropertyOptional({ enum: ['today_yesterday', 'week', 'month'] })
  @IsOptional()
  @IsIn(['today_yesterday', 'week', 'month'])
  compare?: string;
}

export class AnalyticsExportQueryDto {
  @ApiPropertyOptional({ enum: ['csv', 'xlsx', 'pdf'] })
  @IsOptional()
  @IsIn(['csv', 'xlsx', 'pdf'])
  format?: 'csv' | 'xlsx' | 'pdf';

  @ApiPropertyOptional({ enum: ['today', 'yesterday', '7d', '30d', '90d', 'custom'] })
  @IsOptional()
  @IsIn(['today', 'yesterday', '7d', '30d', '90d', 'custom'])
  range?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string;
}

export class MerchantAnalyticsQueryDto {
  @IsString()
  storeId!: string;

  @ApiPropertyOptional({ enum: ['7d', '30d'] })
  @IsOptional()
  @IsIn(['7d', '30d'])
  period?: '7d' | '30d';
}
