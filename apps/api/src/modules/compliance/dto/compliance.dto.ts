import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { GstSlab } from '@prisma/client';
import { Type } from 'class-transformer';

export class ListComplianceQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be YYYY-MM' })
  month?: string;
}

export class ExportComplianceQueryDto extends ListComplianceQueryDto {
  @IsOptional()
  @IsString()
  format?: 'csv' | 'pdf' = 'csv';
}

export class UpdateProductTaxDto {
  @IsOptional()
  @IsString()
  hsnCodeId?: string;

  @IsOptional()
  @IsEnum(GstSlab)
  gstSlab?: GstSlab;

  @IsOptional()
  @IsEnum(['GOODS', 'SERVICES', 'EXEMPT', 'NIL_RATED'])
  taxCategory?: 'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED';

  @IsOptional()
  taxInclusive?: boolean;
}

export class SyncTdsTcsDto {
  @Matches(/^\d{4}-\d{2}$/)
  periodMonth: string;
}
