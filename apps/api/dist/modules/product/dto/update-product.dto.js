"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_product_dto_1 = require("./create-product.dto");
class UpdateProductDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_product_dto_1.CreateProductDto, ['variants', 'quantity', 'lowStockThreshold'])) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateProductDto = UpdateProductDto;
//# sourceMappingURL=update-product.dto.js.map