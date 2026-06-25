import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreatePayoutRequestDto {
  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  accountHolderName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  accountNumber!: string;

  @ApiProperty()
  @IsString()
  @MinLength(11)
  ifsc!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;
}

export class RejectPayoutRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  reason!: string;
}

export class ListSettlementsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

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
