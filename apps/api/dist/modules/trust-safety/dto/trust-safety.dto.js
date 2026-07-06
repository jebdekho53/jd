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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnableCodDto = exports.AdminTrustActionDto = exports.ListTrustQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class ListTrustQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 100 }, category: { required: false, type: () => Object }, status: { required: false, type: () => Object } };
    }
}
exports.ListTrustQueryDto = ListTrustQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListTrustQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListTrustQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.FraudCaseCategory),
    __metadata("design:type", typeof (_a = typeof client_1.FraudCaseCategory !== "undefined" && client_1.FraudCaseCategory) === "function" ? _a : Object)
], ListTrustQueryDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RiskProfileStatus),
    __metadata("design:type", typeof (_b = typeof client_1.RiskProfileStatus !== "undefined" && client_1.RiskProfileStatus) === "function" ? _b : Object)
], ListTrustQueryDto.prototype, "status", void 0);
class AdminTrustActionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { userId: { required: true, type: () => String }, action: { required: true, type: () => Object }, reason: { required: true, type: () => String }, caseId: { required: false, type: () => String } };
    }
}
exports.AdminTrustActionDto = AdminTrustActionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminTrustActionDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['approve', 'reject', 'warn', 'restrict', 'suspend', 'blacklist']),
    __metadata("design:type", String)
], AdminTrustActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminTrustActionDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminTrustActionDto.prototype, "caseId", void 0);
class EnableCodDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { userId: { required: true, type: () => String } };
    }
}
exports.EnableCodDto = EnableCodDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnableCodDto.prototype, "userId", void 0);
//# sourceMappingURL=trust-safety.dto.js.map