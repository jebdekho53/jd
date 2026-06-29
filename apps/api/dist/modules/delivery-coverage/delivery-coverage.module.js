"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryCoverageModule = void 0;
const common_1 = require("@nestjs/common");
const delivery_coverage_service_1 = require("./delivery-coverage.service");
const merchant_delivery_coverage_controller_1 = require("./merchant-delivery-coverage.controller");
const admin_delivery_coverage_controller_1 = require("./admin-delivery-coverage.controller");
const merchant_module_1 = require("../merchant/merchant.module");
const location_directory_module_1 = require("../location-directory/location-directory.module");
const buyer_module_1 = require("../buyer/buyer.module");
let DeliveryCoverageModule = class DeliveryCoverageModule {
};
exports.DeliveryCoverageModule = DeliveryCoverageModule;
exports.DeliveryCoverageModule = DeliveryCoverageModule = __decorate([
    (0, common_1.Module)({
        imports: [merchant_module_1.MerchantModule, location_directory_module_1.LocationDirectoryModule, buyer_module_1.BuyerModule],
        controllers: [merchant_delivery_coverage_controller_1.MerchantDeliveryCoverageController, admin_delivery_coverage_controller_1.AdminDeliveryCoverageController],
        providers: [delivery_coverage_service_1.DeliveryCoverageService],
        exports: [delivery_coverage_service_1.DeliveryCoverageService],
    })
], DeliveryCoverageModule);
//# sourceMappingURL=delivery-coverage.module.js.map