import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { WhatsAppBroadcastMode } from '@prisma/client';

export class CreateWhatsAppBroadcastDto {
  @ApiProperty({ description: 'Internal label, shown in the broadcast list' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: WhatsAppBroadcastMode })
  @IsEnum(WhatsAppBroadcastMode)
  mode!: WhatsAppBroadcastMode;

  @ApiProperty({
    description: 'Raw CSV text. Must contain a "phone" column; all other columns become {{placeholders}}.',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(5_000_000)
  csv!: string;

  @ApiPropertyOptional({
    description: 'TEXT mode only: message body, e.g. "Hi {{name}}, your order is ready."',
  })
  @ValidateIf((dto: CreateWhatsAppBroadcastDto) => dto.mode === WhatsAppBroadcastMode.TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  bodyTemplate?: string;

  @ApiPropertyOptional({ description: 'TEMPLATE mode only: approved Meta template name' })
  @ValidateIf((dto: CreateWhatsAppBroadcastDto) => dto.mode === WhatsAppBroadcastMode.TEMPLATE)
  @IsString()
  @MaxLength(200)
  templateName?: string;

  @ApiPropertyOptional({ description: 'TEMPLATE mode only: template language code, e.g. "en"' })
  @ValidateIf((dto: CreateWhatsAppBroadcastDto) => dto.mode === WhatsAppBroadcastMode.TEMPLATE)
  @IsString()
  @MaxLength(10)
  templateLang?: string;

  @ApiPropertyOptional({
    description:
      'TEMPLATE mode only: CSV column names feeding the template body variables {{1}}, {{2}}, … in order.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  templateParams?: string[];

  @ApiPropertyOptional({
    description: 'Messages per second. Defaults to WHATSAPP_BROADCAST_RATE_PER_SECOND (10).',
    minimum: 1,
    maximum: 80,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(80)
  ratePerSecond?: number;
}

export class ListWhatsAppBroadcastsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
