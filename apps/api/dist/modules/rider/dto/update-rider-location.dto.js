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
exports.UpdateRiderLocationDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateRiderLocationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { latitude: { required: true, type: () => Number }, longitude: { required: true, type: () => Number }, heading: { required: false, type: () => Number, minimum: 0, maximum: 360 }, speed: { required: false, type: () => Number, minimum: 0 }, accuracy: { required: false, type: () => Number, minimum: 0 } };
    }
}
exports.UpdateRiderLocationDto = UpdateRiderLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 28.6139 }),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], UpdateRiderLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 77.209 }),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], UpdateRiderLocationDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Compass heading 0-360' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(360),
    __metadata("design:type", Number)
], UpdateRiderLocationDto.prototype, "heading", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Speed in km/h' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateRiderLocationDto.prototype, "speed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'GPS accuracy in meters' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateRiderLocationDto.prototype, "accuracy", void 0);
//# sourceMappingURL=update-rider-location.dto.js.map