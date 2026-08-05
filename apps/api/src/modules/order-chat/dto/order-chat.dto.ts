import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class SendOrderChatMessageDto {
  @ApiProperty({ description: 'Message text', maxLength: 1000 })
  @IsString()
  @Length(1, 1000)
  body!: string;
}
