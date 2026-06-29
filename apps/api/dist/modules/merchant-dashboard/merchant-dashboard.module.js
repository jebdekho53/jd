"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantDashboardModule = void 0;
const common_1 = require("@nestjs/common");
const merchant_dashboard_controller_1 = require("./merchant-dashboard.controller");
const merchant_dashboard_service_1 = require("./merchant-dashboard.service");
let MerchantDashboardModule = class MerchantDashboardModule {
};
exports.MerchantDashboardModule = MerchantDashboardModule;
exports.MerchantDashboardModule = MerchantDashboardModule = __decorate([
    (0, common_1.Module)({
        controllers: [merchant_dashboard_controller_1.MerchantDashboardController],
        providers: [merchant_dashboard_service_1.MerchantDashboardService],
        exports: [merchant_dashboard_service_1.MerchantDashboardService],
    })
], MerchantDashboardModule);
//# sourceMappingURL=merchant-dashboard.module.js.map