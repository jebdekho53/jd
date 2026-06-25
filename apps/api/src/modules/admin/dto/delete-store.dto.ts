import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class DeleteStoreDto {
  @ApiProperty({ example: 'Duplicate test store removed by platform admin' })
  @IsString()
  @Length(10, 500)
  reason: string;
}
