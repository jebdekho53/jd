import { IsOptional, IsString } from 'class-validator';

export class GrowthQueryDto {
  @IsOptional()
  @IsString()
  storeId?: string;
}
