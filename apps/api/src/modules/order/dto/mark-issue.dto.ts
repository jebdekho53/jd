import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MarkOrderIssueDto {
  @ApiProperty({ example: 'Item unavailable — substituting similar product' })
  @IsOptional()
  @IsString()
  note?: string;
}
