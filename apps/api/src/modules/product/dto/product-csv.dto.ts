import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ProductCsvBodyDto {
  @ApiProperty({ description: 'Raw CSV content' })
  @IsString()
  csv!: string;
}

export class ProductCsvImportDto extends ProductCsvBodyDto {
  @ApiProperty({
    description: '1-based row numbers from validation preview to import',
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  rowNumbers!: number[];
}

export class ProductCsvValidateRowDto {
  rowNumber!: number;
  valid!: boolean;
  errors!: string[];
  preview!: Record<string, unknown>;
}
