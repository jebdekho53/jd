import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FraudCaseCategory, RiskProfileStatus } from '@prisma/client';

export class ListTrustQueryDto {
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
  @IsEnum(FraudCaseCategory)
  category?: FraudCaseCategory;

  @IsOptional()
  @IsEnum(RiskProfileStatus)
  status?: RiskProfileStatus;
}

export class AdminTrustActionDto {
  @IsString()
  userId: string;

  @IsEnum(['approve', 'reject', 'warn', 'restrict', 'suspend', 'blacklist'])
  action: 'approve' | 'reject' | 'warn' | 'restrict' | 'suspend' | 'blacklist';

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  caseId?: string;
}

export class EnableCodDto {
  @IsString()
  userId: string;
}
