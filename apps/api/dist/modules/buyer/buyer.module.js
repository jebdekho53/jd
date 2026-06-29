"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const configuration_1 = require("../../config/configuration");
const buyer_store_service_1 = require("./buyer-store.service");
const buyer_product_service_1 = require("./buyer-product.service");
const buyer_cache_service_1 = require("./buyer-cache.service");
const buyer_controller_1 = require("./buyer.controller");
const buyer_product_review_controller_1 = require("./buyer-product-review.controller");
const product_review_service_1 = require("./product-review.service");
const buyer_visibility_service_1 = require("./buyer-visibility.service");
let BuyerModule = class BuyerModule {
};
exports.BuyerModule = BuyerModule;
exports.BuyerModule = BuyerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const cfg = (0, configuration_1.getConfig)(configService);
                    return {
                        publicKey: cfg.jwt.publicKey,
                        verifyOptions: {
                            algorithms: ['RS256'],
                            issuer: cfg.jwt.issuer,
                            audience: cfg.jwt.audience,
                        },
                    };
                },
            }),
        ],
        controllers: [buyer_controller_1.BuyerController, buyer_product_review_controller_1.BuyerProductReviewController],
        providers: [
            buyer_store_service_1.BuyerStoreService,
            buyer_product_service_1.BuyerProductService,
            buyer_cache_service_1.BuyerCacheService,
            buyer_visibility_service_1.BuyerVisibilityService,
            product_review_service_1.ProductReviewService,
        ],
        exports: [
            buyer_store_service_1.BuyerStoreService,
            buyer_product_service_1.BuyerProductService,
            buyer_cache_service_1.BuyerCacheService,
            buyer_visibility_service_1.BuyerVisibilityService,
            product_review_service_1.ProductReviewService,
        ],
    })
], BuyerModule);
//# sourceMappingURL=buyer.module.js.map