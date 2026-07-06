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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListAdminOrdersDto = exports.ListMerchantOrdersDto = exports.ListOrdersDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const swagger_2 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const cuid_validator_1 = require("../../../common/validators/cuid.validator");
class ListOrdersDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, type: () => Object }, statusGroup: { required: false, type: () => Object, enum: ['active', 'cancelled', 'completed'] }, page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 200 } };
    }
}
exports.ListOrdersDto = ListOrdersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: client_1.OrderStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.OrderStatus),
    __metadata("design:type", typeof (_a = typeof client_1.OrderStatus !== "undefined" && client_1.OrderStatus) === "function" ? _a : Object)
], ListOrdersDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['active', 'cancelled', 'completed'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'cancelled', 'completed']),
    __metadata("design:type", String)
], ListOrdersDto.prototype, "statusGroup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListOrdersDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 20, maximum: 200 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListOrdersDto.prototype, "limit", void 0);
class ListMerchantOrdersDto extends ListOrdersDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { storeId: { required: false, type: () => String }, merchantStatusGroup: { required: false, type: () => Object, enum: ['active', 'new', 'accepted', 'preparing', 'packing', 'ready_for_pickup', 'rider_assigned', 'delivered', 'cancelled'] }, pipelineColumn: { required: false, type: () => String, enum: ['NEW', 'ACCEPTED', 'PREPARING', 'PACKING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] }, today: { required: false, type: () => Boolean }, yesterday: { required: false, type: () => Boolean }, dateFrom: { required: false, type: () => String }, dateTo: { required: false, type: () => String }, paymentMethod: { required: false, type: () => Object }, q: { required: false, type: () => String } };
    }
}
exports.ListMerchantOrdersDto = ListMerchantOrdersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Filter by store ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, cuid_validator_1.IsCuid)(),
    __metadata("design:type", String)
], ListMerchantOrdersDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: ['active', 'new', 'accepted', 'preparing', 'packing', 'ready_for_pickup', 'rider_assigned', 'delivered', 'cancelled'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'new', 'accepted', 'preparing', 'packing', 'ready_for_pickup', 'rider_assigned', 'delivered', 'cancelled']),
    __metadata("design:type", String)
], ListMerchantOrdersDto.prototype, "merchantStatusGroup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: ['NEW', 'ACCEPTED', 'PREPARING', 'PACKING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['NEW', 'ACCEPTED', 'PREPARING', 'PACKING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
    __metadata("design:type", String)
], ListMerchantOrdersDto.prototype, "pipelineColumn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], ListMerchantOrdersDto.prototype, "today", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], ListMerchantOrdersDto.prototype, "yesterday", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListMerchantOrdersDto.prototype, "dateFrom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListMerchantOrdersDto.prototype, "dateTo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: client_1.PaymentMethod }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PaymentMethod),
    __metadata("design:type", typeof (_b = typeof client_1.PaymentMethod !== "undefined" && client_1.PaymentMethod) === "function" ? _b : Object)
], ListMerchantOrdersDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Search order #, customer, phone, product, SKU' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListMerchantOrdersDto.prototype, "q", void 0);
class ListAdminOrdersDto extends (0, swagger_2.OmitType)(ListOrdersDto, ['statusGroup']) {
    static _OPENAPI_METADATA_FACTORY() {
        return { today: { required: false, type: () => Boolean }, statusGroup: { required: false, type: () => Object, enum: ['pending', 'preparing', 'ready_for_pickup', 'assigned', 'delivered', 'cancelled'] }, storeId: { required: false, type: () => String }, merchantId: { required: false, type: () => String }, riderId: { required: false, type: () => String }, dateFrom: { required: false, type: () => String }, dateTo: { required: false, type: () => String }, paymentMethod: { required: false, type: () => Object }, paymentStatus: { required: false, type: () => Object, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] } };
    }
}
exports.ListAdminOrdersDto = ListAdminOrdersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Orders created or paid today (IST)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], ListAdminOrdersDto.prototype, "today", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        enum: ['pending', 'preparing', 'ready_for_pickup', 'assigned', 'delivered', 'cancelled'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['pending', 'preparing', 'ready_for_pickup', 'assigned', 'delivered', 'cancelled']),
    __metadata("design:type", String)
], ListAdminOrdersDto.prototype, "statusGroup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Filter by store ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAdminOrdersDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Filter by merchant profile ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAdminOrdersDto.prototype, "merchantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Filter by rider profile ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAdminOrdersDto.prototype, "riderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Created on or after (ISO date)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListAdminOrdersDto.prototype, "dateFrom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Created on or before (ISO date)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListAdminOrdersDto.prototype, "dateTo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: client_1.PaymentMethod }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PaymentMethod),
    __metadata("design:type", typeof (_c = typeof client_1.PaymentMethod !== "undefined" && client_1.PaymentMethod) === "function" ? _c : Object)
], ListAdminOrdersDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
    __metadata("design:type", String)
], ListAdminOrdersDto.prototype, "paymentStatus", void 0);
//# sourceMappingURL=list-orders.dto.js.map