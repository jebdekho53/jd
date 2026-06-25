import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CodReconciliationStatus, SettlementCycle } from '@prisma/client';

export class ListFinanceQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsEnum(CodReconciliationStatus)
  status?: CodReconciliationStatus;
}

export class CodSubmitDto {
  @IsArray()
  @IsString({ each: true })
  orderIds!: string[];

  @IsNumber()
  @Min(0)
  amountDeposited!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectCodDto {
  @IsString()
  reason!: string;
}

export class GenerateSettlementDto {
  @IsEnum(SettlementCycle)
  cycle!: SettlementCycle;

  @IsOptional()
  @IsString()
  merchantProfileId?: string;
}

export class MarkRiderPayoutPaidDto {
  @IsString()
  referenceId!: string;
}

export class ExportQueryDto {
  @IsOptional()
  @IsString()
  periodMonth?: string;

  @IsOptional()
  @IsString()
  merchantProfileId?: string;
}
