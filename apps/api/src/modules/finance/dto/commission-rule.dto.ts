import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommissionRuleScope } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommissionRuleDto {
  @ApiProperty({ enum: CommissionRuleScope, description: 'GLOBAL, STORE, or CATEGORY' })
  @IsEnum(CommissionRuleScope)
  scope!: CommissionRuleScope;

  @ApiPropertyOptional({ description: 'Required when scope=STORE' })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Required when scope=CATEGORY' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 15, description: 'Commission percentage (0–100)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent!: number;

  @ApiPropertyOptional({ example: 2, description: 'Days before settlement becomes eligible' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(90)
  settlementDelayDays?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCommissionRuleDto {
  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(90)
  settlementDelayDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
