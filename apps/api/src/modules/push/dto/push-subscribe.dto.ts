import { PushDeviceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class PushSubscribeDto {
  @IsString()
  @MaxLength(2048)
  endpoint!: string;

  @IsString()
  @MaxLength(512)
  p256dh!: string;

  @IsString()
  @MaxLength(256)
  auth!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;

  @IsOptional()
  @IsEnum(PushDeviceType)
  deviceType?: PushDeviceType;
}

export class PushUnsubscribeDto {
  @IsString()
  @MaxLength(2048)
  endpoint!: string;
}
