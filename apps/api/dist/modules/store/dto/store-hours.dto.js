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
exports.StoreHourDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
class StoreHourDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { dayOfWeek: { required: true, type: () => Object }, openTime: { required: true, type: () => String, pattern: "TIME_REGEX" }, closeTime: { required: true, type: () => String, pattern: "TIME_REGEX" }, isClosed: { required: true, type: () => Boolean } };
    }
}
exports.StoreHourDto = StoreHourDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.DayOfWeek, example: client_1.DayOfWeek.MONDAY }),
    (0, class_validator_1.IsEnum)(client_1.DayOfWeek),
    __metadata("design:type", typeof (_a = typeof client_1.DayOfWeek !== "undefined" && client_1.DayOfWeek) === "function" ? _a : Object)
], StoreHourDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '09:00', description: 'Opening time in HH:mm (24h)' }),
    (0, class_validator_1.ValidateIf)((o) => !o.isClosed),
    (0, class_validator_1.Matches)(TIME_REGEX, { message: 'openTime must be HH:mm (e.g. 09:00)' }),
    __metadata("design:type", String)
], StoreHourDto.prototype, "openTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '22:00', description: 'Closing time in HH:mm (24h)' }),
    (0, class_validator_1.ValidateIf)((o) => !o.isClosed),
    (0, class_validator_1.Matches)(TIME_REGEX, { message: 'closeTime must be HH:mm (e.g. 22:00)' }),
    __metadata("design:type", String)
], StoreHourDto.prototype, "closeTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'true = store closed all day' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], StoreHourDto.prototype, "isClosed", void 0);
//# sourceMappingURL=store-hours.dto.js.map