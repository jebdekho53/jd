"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMerchantProfileDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_merchant_profile_dto_1 = require("./create-merchant-profile.dto");
class UpdateMerchantProfileDto extends (0, swagger_1.PartialType)(create_merchant_profile_dto_1.CreateMerchantProfileDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateMerchantProfileDto = UpdateMerchantProfileDto;
//# sourceMappingURL=update-merchant-profile.dto.js.map