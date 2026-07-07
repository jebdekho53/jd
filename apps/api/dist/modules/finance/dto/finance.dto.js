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
exports.ExportQueryDto = exports.MarkRiderPayoutPaidDto = exports.GenerateSettlementDto = exports.RejectCodDto = exports.CodSubmitDto = exports.ListFinanceQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class ListFinanceQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: false, type: () => Number, minimum: 1 }, limit: { required: false, type: () => Number, minimum: 1 }, status: { required: false, type: () => Object } };
    }
}
exports.ListFinanceQueryDto = ListFinanceQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListFinanceQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListFinanceQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CodReconciliationStatus),
    __metadata("design:type", String)
], ListFinanceQueryDto.prototype, "status", void 0);
class CodSubmitDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { orderIds: { required: true, type: () => [String] }, amountDeposited: { required: true, type: () => Number, minimum: 0 }, notes: { required: false, type: () => String } };
    }
}
exports.CodSubmitDto = CodSubmitDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CodSubmitDto.prototype, "orderIds", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CodSubmitDto.prototype, "amountDeposited", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CodSubmitDto.prototype, "notes", void 0);
class RejectCodDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String } };
    }
}
exports.RejectCodDto = RejectCodDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RejectCodDto.prototype, "reason", void 0);
class GenerateSettlementDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { cycle: { required: true, type: () => Object }, merchantProfileId: { required: false, type: () => String } };
    }
}
exports.GenerateSettlementDto = GenerateSettlementDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SettlementCycle),
    __metadata("design:type", String)
], GenerateSettlementDto.prototype, "cycle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateSettlementDto.prototype, "merchantProfileId", void 0);
class MarkRiderPayoutPaidDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { referenceId: { required: true, type: () => String } };
    }
}
exports.MarkRiderPayoutPaidDto = MarkRiderPayoutPaidDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkRiderPayoutPaidDto.prototype, "referenceId", void 0);
class ExportQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { periodMonth: { required: false, type: () => String }, merchantProfileId: { required: false, type: () => String } };
    }
}
exports.ExportQueryDto = ExportQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportQueryDto.prototype, "periodMonth", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportQueryDto.prototype, "merchantProfileId", void 0);
//# sourceMappingURL=finance.dto.js.map