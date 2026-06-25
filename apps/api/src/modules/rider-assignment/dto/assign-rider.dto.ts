import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRiderDto {
  @ApiProperty({ description: 'Rider profile ID to assign' })
  @IsString()
  @MinLength(1)
  riderProfileId!: string;
}
