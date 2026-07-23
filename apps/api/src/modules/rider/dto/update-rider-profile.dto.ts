import { ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Self-service edits a rider can make to their own profile after signup.
 * Deliberately excludes kycStatus, status, and ratings — those are set by
 * compliance, the availability toggle, and completed deliveries respectively.
 */
export class UpdateRiderProfileDto {
  @ApiPropertyOptional({ example: 'Ramesh Kumar' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ example: 'UP14 AB 1234' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: 'DL-1420110012345' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  licenseNumber?: string;
}
