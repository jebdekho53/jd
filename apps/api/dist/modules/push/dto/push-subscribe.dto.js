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
exports.PushUnsubscribeDto = exports.PushSubscribeDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class PushSubscribeDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { endpoint: { required: true, type: () => String, maxLength: 2048 }, p256dh: { required: true, type: () => String, maxLength: 512 }, auth: { required: true, type: () => String, maxLength: 256 }, userAgent: { required: false, type: () => String, maxLength: 512 }, deviceType: { required: false, type: () => Object } };
    }
}
exports.PushSubscribeDto = PushSubscribeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2048),
    __metadata("design:type", String)
], PushSubscribeDto.prototype, "endpoint", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(512),
    __metadata("design:type", String)
], PushSubscribeDto.prototype, "p256dh", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(256),
    __metadata("design:type", String)
], PushSubscribeDto.prototype, "auth", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(512),
    __metadata("design:type", String)
], PushSubscribeDto.prototype, "userAgent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PushDeviceType),
    __metadata("design:type", typeof (_a = typeof client_1.PushDeviceType !== "undefined" && client_1.PushDeviceType) === "function" ? _a : Object)
], PushSubscribeDto.prototype, "deviceType", void 0);
class PushUnsubscribeDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { endpoint: { required: true, type: () => String, maxLength: 2048 } };
    }
}
exports.PushUnsubscribeDto = PushUnsubscribeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2048),
    __metadata("design:type", String)
], PushUnsubscribeDto.prototype, "endpoint", void 0);
//# sourceMappingURL=push-subscribe.dto.js.map