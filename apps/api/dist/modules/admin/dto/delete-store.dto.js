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
exports.DeleteStoreDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class DeleteStoreDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, minLength: 10, maxLength: 500 } };
    }
}
exports.DeleteStoreDto = DeleteStoreDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Duplicate test store removed by platform admin' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 500),
    __metadata("design:type", String)
], DeleteStoreDto.prototype, "reason", void 0);
//# sourceMappingURL=delete-store.dto.js.map