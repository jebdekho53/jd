import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const PHONE_REGEX = /^[6-9]\d{9}$/;

export class OfflineBillItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOfflineBillDto {
  @Matches(PHONE_REGEX, { message: 'customerPhone must be a valid 10-digit Indian mobile number' })
  customerPhone!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  customerName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'A bill needs at least one item' })
  @ValidateNested({ each: true })
  @Type(() => OfflineBillItemDto)
  items!: OfflineBillItemDto[];
}

export class ListOfflineBillsDto {
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
