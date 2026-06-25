import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class RemoveBlacklistDto {
  @ApiProperty({
    example: 'False positive confirmed after manual review. Blacklist removed.',
  })
  @IsString()
  @Length(10, 500)
  reason!: string;

  @ApiProperty({
    required: false,
    description: 'Optional store to reopen as UNDER_REVIEW after blacklist removal',
  })
  @IsOptional()
  @IsString()
  reopenStoreId?: string;
}
