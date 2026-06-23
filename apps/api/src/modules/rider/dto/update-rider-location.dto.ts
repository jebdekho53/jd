import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateRiderLocationDto {
  @ApiProperty({ example: 28.6139 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 77.209 })
  @IsLongitude()
  longitude: number;

  @ApiProperty({ required: false, description: 'Compass heading 0-360' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiProperty({ required: false, description: 'Speed in km/h' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiProperty({ required: false, description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;
}
