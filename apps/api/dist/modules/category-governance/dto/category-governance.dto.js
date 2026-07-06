"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkCategoryRequestActionDto = exports.ListCategoryRequestsDto = exports.RevokeCategoryRejectionDto = exports.RequestCategoryDocumentsDto = exports.RejectCategoryRequestDto = exports.UploadCategoryDocumentDto = exports.RequestCategoryAccessDto = exports.RequestStoreCategoryAccessDto = exports.UpdateGlobalCategoryDto = exports.CreateGlobalCategoryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateGlobalCategoryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, maxLength: 100 }, parentId: { required: false, type: () => String }, imageUrl: { required: true, type: () => String }, icon: { required: false, type: () => String, maxLength: 500 }, description: { required: false, type: () => String, maxLength: 2000 }, sortOrder: { required: false, type: () => Number, minimum: 0 }, catalogKind: { required: false, type: () => Object } };
    }
}
exports.CreateGlobalCategoryDto = CreateGlobalCategoryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateGlobalCategoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGlobalCategoryDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateGlobalCategoryDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateGlobalCategoryDto.prototype, "icon", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateGlobalCategoryDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateGlobalCategoryDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CategoryCatalogKind),
    __metadata("design:type", typeof (_a = typeof client_1.CategoryCatalogKind !== "undefined" && client_1.CategoryCatalogKind) === "function" ? _a : Object)
], CreateGlobalCategoryDto.prototype, "catalogKind", void 0);
class UpdateGlobalCategoryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String, maxLength: 100 }, imageUrl: { required: false, type: () => String }, icon: { required: false, type: () => String, maxLength: 500 }, description: { required: false, type: () => String, maxLength: 2000 }, sortOrder: { required: false, type: () => Number, minimum: 0 }, isActive: { required: false, type: () => Boolean }, catalogKind: { required: false, type: () => Object } };
    }
}
exports.UpdateGlobalCategoryDto = UpdateGlobalCategoryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateGlobalCategoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], UpdateGlobalCategoryDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateGlobalCategoryDto.prototype, "icon", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateGlobalCategoryDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateGlobalCategoryDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateGlobalCategoryDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CategoryCatalogKind),
    __metadata("design:type", typeof (_b = typeof client_1.CategoryCatalogKind !== "undefined" && client_1.CategoryCatalogKind) === "function" ? _b : Object)
], UpdateGlobalCategoryDto.prototype, "catalogKind", void 0);
class RequestStoreCategoryAccessDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { categoryId: { required: true, type: () => String }, subcategoryId: { required: true, type: () => String }, reason: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.RequestStoreCategoryAccessDto = RequestStoreCategoryAccessDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestStoreCategoryAccessDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestStoreCategoryAccessDto.prototype, "subcategoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], RequestStoreCategoryAccessDto.prototype, "reason", void 0);
class RequestCategoryAccessDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { categoryId: { required: true, type: () => String }, requestNote: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.RequestCategoryAccessDto = RequestCategoryAccessDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestCategoryAccessDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], RequestCategoryAccessDto.prototype, "requestNote", void 0);
class UploadCategoryDocumentDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { documentType: { required: true, type: () => Object }, fileName: { required: true, type: () => String }, fileUrl: { required: true, type: () => String }, mimeType: { required: true, type: () => String } };
    }
}
exports.UploadCategoryDocumentDto = UploadCategoryDocumentDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.StoreDocumentType),
    __metadata("design:type", typeof (_c = typeof client_1.StoreDocumentType !== "undefined" && client_1.StoreDocumentType) === "function" ? _c : Object)
], UploadCategoryDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadCategoryDocumentDto.prototype, "fileName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadCategoryDocumentDto.prototype, "fileUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadCategoryDocumentDto.prototype, "mimeType", void 0);
class RejectCategoryRequestDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, maxLength: 1000 } };
    }
}
exports.RejectCategoryRequestDto = RejectCategoryRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], RejectCategoryRequestDto.prototype, "reason", void 0);
class RequestCategoryDocumentsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, maxLength: 1000 }, documentTypes: { required: false, type: () => [Object] } };
    }
}
exports.RequestCategoryDocumentsDto = RequestCategoryDocumentsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], RequestCategoryDocumentsDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.StoreDocumentType, { each: true }),
    __metadata("design:type", Array)
], RequestCategoryDocumentsDto.prototype, "documentTypes", void 0);
class RevokeCategoryRejectionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, maxLength: 1000 } };
    }
}
exports.RevokeCategoryRejectionDto = RevokeCategoryRejectionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], RevokeCategoryRejectionDto.prototype, "reason", void 0);
class ListCategoryRequestsDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, type: () => Object }, storeId: { required: false, type: () => String }, page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1 } };
    }
}
exports.ListCategoryRequestsDto = ListCategoryRequestsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.StoreCategoryRequestStatus),
    __metadata("design:type", typeof (_d = typeof client_1.StoreCategoryRequestStatus !== "undefined" && client_1.StoreCategoryRequestStatus) === "function" ? _d : Object)
], ListCategoryRequestsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListCategoryRequestsDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListCategoryRequestsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListCategoryRequestsDto.prototype, "limit", void 0);
class BulkCategoryRequestActionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { requestIds: { required: true, type: () => [String] }, action: { required: true, type: () => Object }, reason: { required: false, type: () => String, maxLength: 1000 }, documentTypes: { required: false, type: () => [Object] } };
    }
}
exports.BulkCategoryRequestActionDto = BulkCategoryRequestActionDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkCategoryRequestActionDto.prototype, "requestIds", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BulkCategoryRequestActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], BulkCategoryRequestActionDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.StoreDocumentType, { each: true }),
    __metadata("design:type", Array)
], BulkCategoryRequestActionDto.prototype, "documentTypes", void 0);
//# sourceMappingURL=category-governance.dto.js.map