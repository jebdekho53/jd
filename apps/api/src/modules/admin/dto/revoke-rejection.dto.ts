import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RevokeRejectionDto {
  @ApiProperty({
    example: 'Merchant has submitted valid documents. Previous rejection revoked.',
  })
  @IsString()
  @Length(10, 500)
  reason!: string;
}
