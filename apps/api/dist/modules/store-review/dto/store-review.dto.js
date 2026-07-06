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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListStoreReviewsDto = exports.ModerateReviewDto = exports.ReportReviewDto = exports.MerchantReplyDto = exports.UpdateStoreReviewDto = exports.CreateStoreReviewDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateStoreReviewDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { rating: { required: true, type: () => Number, minimum: 1, maximum: 5 }, storeExperience: { required: true, type: () => Number, minimum: 1, maximum: 5 }, deliveryExperience: { required: true, type: () => Number, minimum: 1, maximum: 5 }, productQuality: { required: true, type: () => Number, minimum: 1, maximum: 5 }, title: { required: false, type: () => String, maxLength: 120 }, review: { required: false, type: () => String, maxLength: 2000 }, images: { required: false, type: () => [String] } };
    }
}
exports.CreateStoreReviewDto = CreateStoreReviewDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateStoreReviewDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateStoreReviewDto.prototype, "storeExperience", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateStoreReviewDto.prototype, "deliveryExperience", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateStoreReviewDto.prototype, "productQuality", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateStoreReviewDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateStoreReviewDto.prototype, "review", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(5),
    (0, class_validator_1.IsUrl)({}, { each: true }),
    __metadata("design:type", Array)
], CreateStoreReviewDto.prototype, "images", void 0);
class UpdateStoreReviewDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { rating: { required: false, type: () => Number, minimum: 1, maximum: 5 }, storeExperience: { required: false, type: () => Number, minimum: 1, maximum: 5 }, deliveryExperience: { required: false, type: () => Number, minimum: 1, maximum: 5 }, productQuality: { required: false, type: () => Number, minimum: 1, maximum: 5 }, title: { required: false, type: () => String, maxLength: 120 }, review: { required: false, type: () => String, maxLength: 2000 }, images: { required: false, type: () => [String] } };
    }
}
exports.UpdateStoreReviewDto = UpdateStoreReviewDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], UpdateStoreReviewDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], UpdateStoreReviewDto.prototype, "storeExperience", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], UpdateStoreReviewDto.prototype, "deliveryExperience", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], UpdateStoreReviewDto.prototype, "productQuality", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateStoreReviewDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateStoreReviewDto.prototype, "review", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(5),
    (0, class_validator_1.IsUrl)({}, { each: true }),
    __metadata("design:type", Array)
], UpdateStoreReviewDto.prototype, "images", void 0);
class MerchantReplyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reply: { required: true, type: () => String, maxLength: 2000 } };
    }
}
exports.MerchantReplyDto = MerchantReplyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], MerchantReplyDto.prototype, "reply", void 0);
class ReportReviewDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, maxLength: 1000 } };
    }
}
exports.ReportReviewDto = ReportReviewDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], ReportReviewDto.prototype, "reason", void 0);
class ModerateReviewDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: false, type: () => String, maxLength: 1000 } };
    }
}
exports.ModerateReviewDto = ModerateReviewDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], ModerateReviewDto.prototype, "reason", void 0);
class ListStoreReviewsDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 50 }, rating: { required: false, type: () => Number, minimum: 1, maximum: 5 }, q: { required: false, type: () => String }, status: { required: false, type: () => Object } };
    }
}
exports.ListStoreReviewsDto = ListStoreReviewsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListStoreReviewsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], ListStoreReviewsDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], ListStoreReviewsDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListStoreReviewsDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ReviewStatus),
    __metadata("design:type", typeof (_a = typeof client_1.ReviewStatus !== "undefined" && client_1.ReviewStatus) === "function" ? _a : Object)
], ListStoreReviewsDto.prototype, "status", void 0);
//# sourceMappingURL=store-review.dto.js.map