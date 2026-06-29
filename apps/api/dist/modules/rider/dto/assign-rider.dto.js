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
exports.AssignRiderDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AssignRiderDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { riderProfileId: { required: true, type: () => String } };
    }
}
exports.AssignRiderDto = AssignRiderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rider profile ID to assign to this delivery' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignRiderDto.prototype, "riderProfileId", void 0);
//# sourceMappingURL=assign-rider.dto.js.map