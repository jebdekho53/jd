import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchLocationsDto {
  @IsString()
  @MinLength(1)
  q!: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class ListAdminLocationsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class ValidatePincodeDto {
  @IsString()
  pincode!: string;

  @IsOptional()
  @IsString()
  locationCityId?: string;

  @IsOptional()
  @IsString()
  locationAreaId?: string;
}

export class SetLocationActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

export class ImportLocationsDto {
  csv!: string;
}
