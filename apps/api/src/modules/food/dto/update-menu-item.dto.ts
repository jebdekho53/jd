import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DietType, MenuItemAvailability, SpiceLevel } from '@prisma/client';

export class UpdateMenuItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  mrp?: number;

  @ApiPropertyOptional({ enum: DietType })
  @IsOptional()
  @IsEnum(DietType)
  dietType?: DietType;

  @ApiPropertyOptional({ enum: SpiceLevel })
  @IsOptional()
  @IsEnum(SpiceLevel)
  spiceLevel?: SpiceLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  prepTimeMins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  servingSize?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cuisineName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowsSpecialInstructions?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ enum: MenuItemAvailability })
  @IsOptional()
  @IsEnum(MenuItemAvailability)
  availability?: MenuItemAvailability;
}

export class SetMenuItemAvailabilityDto {
  @ApiPropertyOptional({ enum: MenuItemAvailability })
  @IsEnum(MenuItemAvailability)
  availability!: MenuItemAvailability;
}
