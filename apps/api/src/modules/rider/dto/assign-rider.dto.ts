import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignRiderDto {
  @ApiProperty({ description: 'Rider profile ID to assign to this delivery' })
  @IsString()
  riderProfileId: string;
}
