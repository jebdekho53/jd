"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryGovernanceModule = void 0;
const common_1 = require("@nestjs/common");
const merchant_module_1 = require("../merchant/merchant.module");
const buyer_module_1 = require("../buyer/buyer.module");
const store_vertical_module_1 = require("../store-vertical/store-vertical.module");
const admin_category_governance_service_1 = require("./admin-category-governance.service");
const admin_category_governance_controller_1 = require("./admin-category-governance.controller");
const merchant_category_request_service_1 = require("./merchant-category-request.service");
const merchant_category_governance_controller_1 = require("./merchant-category-governance.controller");
const merchant_category_access_service_1 = require("./merchant-category-access.service");
const store_category_access_service_1 = require("./store-category-access.service");
const store_category_request_service_1 = require("./store-category-request.service");
let CategoryGovernanceModule = class CategoryGovernanceModule {
};
exports.CategoryGovernanceModule = CategoryGovernanceModule;
exports.CategoryGovernanceModule = CategoryGovernanceModule = __decorate([
    (0, common_1.Module)({
        imports: [merchant_module_1.MerchantModule, buyer_module_1.BuyerModule, store_vertical_module_1.StoreVerticalModule],
        controllers: [admin_category_governance_controller_1.AdminCategoryGovernanceController, merchant_category_governance_controller_1.MerchantCategoryGovernanceController],
        providers: [
            admin_category_governance_service_1.AdminCategoryGovernanceService,
            merchant_category_request_service_1.MerchantCategoryRequestService,
            merchant_category_access_service_1.MerchantCategoryAccessService,
            store_category_access_service_1.StoreCategoryAccessService,
            store_category_request_service_1.StoreCategoryRequestService,
        ],
        exports: [
            admin_category_governance_service_1.AdminCategoryGovernanceService,
            merchant_category_request_service_1.MerchantCategoryRequestService,
            merchant_category_access_service_1.MerchantCategoryAccessService,
            store_category_access_service_1.StoreCategoryAccessService,
            store_category_request_service_1.StoreCategoryRequestService,
        ],
    })
], CategoryGovernanceModule);
//# sourceMappingURL=category-governance.module.js.map