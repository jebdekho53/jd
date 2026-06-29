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
exports.RemoveBlacklistDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RemoveBlacklistDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, minLength: 10, maxLength: 500 }, reopenStoreId: { required: false, type: () => String } };
    }
}
exports.RemoveBlacklistDto = RemoveBlacklistDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'False positive confirmed after manual review. Blacklist removed.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 500),
    __metadata("design:type", String)
], RemoveBlacklistDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        description: 'Optional store to reopen as UNDER_REVIEW after blacklist removal',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RemoveBlacklistDto.prototype, "reopenStoreId", void 0);
//# sourceMappingURL=remove-blacklist.dto.js.map