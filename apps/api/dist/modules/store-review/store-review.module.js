"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreReviewModule = void 0;
const common_1 = require("@nestjs/common");
const buyer_module_1 = require("../buyer/buyer.module");
const store_review_service_1 = require("./store-review.service");
const store_reputation_service_1 = require("./store-reputation.service");
const buyer_store_review_controller_1 = require("./buyer-store-review.controller");
const merchant_store_review_controller_1 = require("./merchant-store-review.controller");
const admin_store_review_controller_1 = require("./admin-store-review.controller");
let StoreReviewModule = class StoreReviewModule {
};
exports.StoreReviewModule = StoreReviewModule;
exports.StoreReviewModule = StoreReviewModule = __decorate([
    (0, common_1.Module)({
        imports: [buyer_module_1.BuyerModule],
        controllers: [
            buyer_store_review_controller_1.BuyerStoreReviewController,
            buyer_store_review_controller_1.PublicStoreReviewController,
            merchant_store_review_controller_1.MerchantStoreReviewController,
            admin_store_review_controller_1.AdminStoreReviewController,
        ],
        providers: [store_review_service_1.StoreReviewService, store_reputation_service_1.StoreReputationService],
        exports: [store_review_service_1.StoreReviewService, store_reputation_service_1.StoreReputationService],
    })
], StoreReviewModule);
//# sourceMappingURL=store-review.module.js.map