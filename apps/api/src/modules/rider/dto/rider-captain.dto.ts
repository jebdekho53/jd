import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiderDocumentStatus, RiderDocumentType, RiderIncentiveStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, Min, MinLength } from 'class-validator';

export class SaveRiderDocumentDto {
  @ApiProperty({ enum: RiderDocumentType })
  @IsEnum(RiderDocumentType)
  documentType!: RiderDocumentType;

  @ApiProperty({ example: 'https://cdn.jebdekho.com/uploads/rider-document/file.pdf' })
  @IsUrl({ require_tld: false })
  fileUrl!: string;
}

export class ShiftLocationDto {
  @ApiPropertyOptional({ example: 28.6139 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 77.209 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class MarkNotificationReadDto {
  @ApiPropertyOptional({ description: 'Optional notification id. If omitted, all rider notifications are marked read.' })
  @IsOptional()
  @IsString()
  notificationId?: string;
}

export class ListRiderDocumentsQueryDto {
  @ApiPropertyOptional({ enum: RiderDocumentStatus })
  @IsOptional()
  @IsEnum(RiderDocumentStatus)
  status?: RiderDocumentStatus;
}

export class RejectRiderDocumentDto {
  @ApiProperty({ example: 'Driving licence image is unclear.' })
  @IsString()
  @MinLength(3)
  reason!: string;
}

export class ListRiderIncentivesQueryDto {
  @ApiPropertyOptional({ enum: RiderIncentiveStatus })
  @IsOptional()
  @IsEnum(RiderIncentiveStatus)
  status?: RiderIncentiveStatus;
}

export class UpsertRiderIncentiveDto {
  @ApiProperty({ example: 'WEEKEND_20' })
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ example: 'Weekend power run' })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiPropertyOptional({ example: 'Complete 20 deliveries this weekend.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetDeliveries!: number;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rewardAmount!: number;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-08-07T23:59:59.000Z' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ enum: RiderIncentiveStatus })
  @IsOptional()
  @IsEnum(RiderIncentiveStatus)
  status?: RiderIncentiveStatus;
}

export class UpdateRiderIncentiveDto {
  @ApiPropertyOptional({ example: 'Weekend power run' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional({ example: 'Complete 20 deliveries this weekend.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetDeliveries?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rewardAmount?: number;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ example: '2026-08-07T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ enum: RiderIncentiveStatus })
  @IsOptional()
  @IsEnum(RiderIncentiveStatus)
  status?: RiderIncentiveStatus;
}
