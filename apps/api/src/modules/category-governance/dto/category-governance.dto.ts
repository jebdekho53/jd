import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { CategoryCatalogKind, MerchantCategoryStatus, StoreCategoryRequestStatus, StoreDocumentType } from '@prisma/client';

export class CreateGlobalCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsNotEmpty()
  @IsUrl()
  imageUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsEnum(CategoryCatalogKind)
  catalogKind?: CategoryCatalogKind;
}

export class UpdateGlobalCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(CategoryCatalogKind)
  catalogKind?: CategoryCatalogKind;
}

export class RequestStoreCategoryAccessDto {
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  subcategoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class RequestCategoryAccessDto {
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  requestNote?: string;
}

export class UploadCategoryDocumentDto {
  @IsEnum(StoreDocumentType)
  documentType!: StoreDocumentType;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}

export class RejectCategoryRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

export class RequestCategoryDocumentsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  @IsArray()
  @IsEnum(StoreDocumentType, { each: true })
  documentTypes?: StoreDocumentType[];
}

export class RevokeCategoryRejectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

export class ListCategoryRequestsDto {
  @IsOptional()
  @IsEnum(StoreCategoryRequestStatus)
  status?: StoreCategoryRequestStatus;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class BulkCategoryRequestActionDto {
  @IsArray()
  @IsString({ each: true })
  requestIds!: string[];

  @IsString()
  @IsNotEmpty()
  action!: 'approve' | 'reject' | 'request-documents' | 'move-to-review';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(StoreDocumentType, { each: true })
  documentTypes?: StoreDocumentType[];
}
