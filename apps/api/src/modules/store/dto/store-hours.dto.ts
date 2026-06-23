import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, Matches, ValidateIf } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class StoreHourDto {
  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '09:00', description: 'Opening time in HH:mm (24h)' })
  @ValidateIf((o: StoreHourDto) => !o.isClosed)
  @Matches(TIME_REGEX, { message: 'openTime must be HH:mm (e.g. 09:00)' })
  openTime: string;

  @ApiProperty({ example: '22:00', description: 'Closing time in HH:mm (24h)' })
  @ValidateIf((o: StoreHourDto) => !o.isClosed)
  @Matches(TIME_REGEX, { message: 'closeTime must be HH:mm (e.g. 22:00)' })
  closeTime: string;

  @ApiProperty({ example: false, description: 'true = store closed all day' })
  @IsBoolean()
  isClosed: boolean;
}
