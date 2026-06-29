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
exports.VerifyPaymentDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class VerifyPaymentDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { checkoutId: { required: true, type: () => String }, razorpayOrderId: { required: true, type: () => String }, razorpayPaymentId: { required: true, type: () => String }, razorpaySignature: { required: true, type: () => String } };
    }
}
exports.VerifyPaymentDto = VerifyPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'checkoutId from POST /buyer/checkout response' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "checkoutId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'razorpay_order_id from Razorpay response' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'razorpay_payment_id from Razorpay response' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'razorpay_signature from Razorpay response' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyPaymentDto.prototype, "razorpaySignature", void 0);
//# sourceMappingURL=verify-payment.dto.js.map