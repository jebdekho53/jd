import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min, ValidateIf } from 'class-validator';
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
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
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

export class EnsureHsnCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}(\d{2}){0,2}$/, { message: 'HSN code must be numeric and 4, 6, or 8 digits' })
  code!: string;

  @IsEnum(GstSlab)
  gstSlab!: GstSlab;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SyncTdsTcsDto {
  @Matches(/^\d{4}-\d{2}$/)
  periodMonth: string;
}
