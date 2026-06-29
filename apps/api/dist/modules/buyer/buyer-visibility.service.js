"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerVisibilityService = void 0;
const common_1 = require("@nestjs/common");
const buyer_visibility_util_1 = require("./buyer-visibility.util");
let BuyerVisibilityService = class BuyerVisibilityService {
    constructor() {
        this.storeVisibleWhere = buyer_visibility_util_1.STORE_VISIBLE_WHERE;
        this.productVisibleWhere = buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE;
        this.storeDiscoveryInclude = buyer_visibility_util_1.STORE_DISCOVERY_INCLUDE;
        this.defaultDiscoveryRadiusKm = buyer_visibility_util_1.DEFAULT_BUYER_DISCOVERY_RADIUS_KM;
        this.isStoreVisible = buyer_visibility_util_1.isStoreVisible;
        this.isProductVisible = buyer_visibility_util_1.isProductVisible;
    }
    canDeliverToBuyer(store, ctx) {
        return (0, buyer_visibility_util_1.canDeliverToBuyer)(store, ctx);
    }
    resolveDeliveryTerms(store, pincode) {
        return (0, buyer_visibility_util_1.resolveBuyerDeliveryTerms)(store, pincode);
    }
};
exports.BuyerVisibilityService = BuyerVisibilityService;
exports.BuyerVisibilityService = BuyerVisibilityService = __decorate([
    (0, common_1.Injectable)()
], BuyerVisibilityService);
//# sourceMappingURL=buyer-visibility.service.js.map