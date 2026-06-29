"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const admin_store_service_1 = require("./admin-store.service");
const admin_store_controller_1 = require("./admin-store.controller");
const admin_merchant_service_1 = require("./admin-merchant.service");
const admin_merchant_controller_1 = require("./admin-merchant.controller");
const admin_media_controller_1 = require("./admin-media.controller");
const admin_media_service_1 = require("./admin-media.service");
const admin_product_controller_1 = require("./admin-product.controller");
const admin_product_service_1 = require("./admin-product.service");
const admin_ai_product_usage_controller_1 = require("./admin-ai-product-usage.controller");
const admin_ai_product_usage_service_1 = require("./admin-ai-product-usage.service");
const admin_merchant_ai_wallet_controller_1 = require("./admin-merchant-ai-wallet.controller");
const store_module_1 = require("../store/store.module");
const store_vertical_module_1 = require("../store-vertical/store-vertical.module");
const buyer_module_1 = require("../buyer/buyer.module");
const merchant_module_1 = require("../merchant/merchant.module");
const product_module_1 = require("../product/product.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [store_module_1.StoreModule, store_vertical_module_1.StoreVerticalModule, buyer_module_1.BuyerModule, merchant_module_1.MerchantModule, product_module_1.ProductModule],
        controllers: [
            admin_store_controller_1.AdminStoreController,
            admin_merchant_controller_1.AdminMerchantController,
            admin_media_controller_1.AdminMediaController,
            admin_product_controller_1.AdminProductController,
            admin_ai_product_usage_controller_1.AdminAiProductUsageController,
            admin_merchant_ai_wallet_controller_1.AdminMerchantAiWalletController,
        ],
        providers: [
            admin_store_service_1.AdminStoreService,
            admin_merchant_service_1.AdminMerchantService,
            admin_media_service_1.AdminMediaService,
            admin_product_service_1.AdminProductService,
            admin_ai_product_usage_service_1.AdminAiProductUsageService,
        ],
        exports: [
            admin_store_service_1.AdminStoreService,
            admin_merchant_service_1.AdminMerchantService,
            admin_media_service_1.AdminMediaService,
            admin_product_service_1.AdminProductService,
            admin_ai_product_usage_service_1.AdminAiProductUsageService,
        ],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map