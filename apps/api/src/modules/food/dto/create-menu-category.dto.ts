import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MenuCategorySlug } from '@prisma/client';

export class CreateMenuCategoryDto {
  @ApiProperty({ description: 'Approved platform menu subcategory id' })
  @IsString()
  @IsNotEmpty()
  platformCategoryId!: string;

  @ApiPropertyOptional({ description: 'Optional display name override (defaults to platform name)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ enum: MenuCategorySlug })
  @IsOptional()
  @IsEnum(MenuCategorySlug)
  categorySlug?: MenuCategorySlug;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
