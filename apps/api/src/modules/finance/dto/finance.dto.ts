import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
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

export class SaveRiderBankAccountDto {
  @IsString()
  @Length(2, 120)
  accountHolderName!: string;

  @Matches(/^\d{6,20}$/, { message: 'Account number must be 6-20 digits' })
  accountNumber!: string;

  @Matches(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, { message: 'IFSC is not valid' })
  ifsc!: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  bankName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  upiId?: string;
}
