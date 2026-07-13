import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterRiderDto {
  @ApiProperty({ example: 'Ramesh Kumar' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

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
