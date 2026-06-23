import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { StoreStatus } from '@prisma/client';

export class ListStoreApprovalsDto {
  @ApiProperty({
    required: false,
    enum: StoreStatus,
    default: StoreStatus.PENDING_REVIEW,
    description: 'Filter by store status',
  })
  @IsOptional()
  @IsEnum(StoreStatus)
  status?: StoreStatus = StoreStatus.PENDING_REVIEW;

  @ApiProperty({ required: false, description: 'Filter by city ID' })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
