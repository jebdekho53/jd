import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { RiderStatus } from '@prisma/client';

export class UpdateRiderStatusDto {
  @ApiProperty({ enum: ['ONLINE', 'OFFLINE'], description: 'Rider can only toggle between ONLINE and OFFLINE manually' })
  @IsIn([RiderStatus.ONLINE, RiderStatus.OFFLINE])
  status: RiderStatus;
}
