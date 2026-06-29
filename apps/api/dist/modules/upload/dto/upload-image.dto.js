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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadImageDto = exports.UploadImagePurpose = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var UploadImagePurpose;
(function (UploadImagePurpose) {
    UploadImagePurpose["PRODUCT"] = "product";
    UploadImagePurpose["STORE_LOGO"] = "store-logo";
    UploadImagePurpose["STORE_BANNER"] = "store-banner";
    UploadImagePurpose["CATEGORY"] = "category";
    UploadImagePurpose["REVIEW"] = "review";
    UploadImagePurpose["AI_PRODUCT"] = "ai-product";
})(UploadImagePurpose || (exports.UploadImagePurpose = UploadImagePurpose = {}));
class UploadImageDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { dataUrl: { required: true, type: () => String, minLength: 32, maxLength: 5000000 }, purpose: { required: true, enum: require("./upload-image.dto").UploadImagePurpose } };
    }
}
exports.UploadImageDto = UploadImageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Base64 data URL (image/jpeg or image/png)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(32),
    (0, class_validator_1.MaxLength)(5_000_000),
    __metadata("design:type", String)
], UploadImageDto.prototype, "dataUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: UploadImagePurpose }),
    (0, class_validator_1.IsEnum)(UploadImagePurpose),
    __metadata("design:type", String)
], UploadImageDto.prototype, "purpose", void 0);
//# sourceMappingURL=upload-image.dto.js.map