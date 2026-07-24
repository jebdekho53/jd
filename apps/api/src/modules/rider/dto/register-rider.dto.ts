import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { requiresDrivingLicense } from '../../../common/utils/vehicle.util';

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

  @ApiPropertyOptional({
    example: 'DL-1420110012345',
    description: 'Required for any motorised vehicle (motorcycle, scooter, car) — optional for bicycle/on-foot',
  })
  @ValidateIf((o: RegisterRiderDto) => requiresDrivingLicense(o.vehicleType))
  @IsNotEmpty({ message: 'Driving licence number is required for this vehicle type' })
  @IsString()
  @MaxLength(40)
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'RID1A2B3C4D', description: 'Another rider\'s referral code' })
  @IsOptional()
  @IsString()
  @Length(3, 20)
  referralCode?: string;
}
