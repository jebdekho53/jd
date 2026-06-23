import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class SuspendStoreDto {
  @ApiProperty({ example: 'Multiple unresolved customer complaints' })
  @IsString()
  @Length(10, 500)
  reason: string;
}
