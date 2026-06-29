"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const buyer_module_1 = require("../buyer/buyer.module");
const merchant_module_1 = require("../merchant/merchant.module");
const inventory_service_1 = require("./inventory.service");
const inventory_cache_service_1 = require("./inventory-cache.service");
const inventory_alert_service_1 = require("./inventory-alert.service");
const merchant_inventory_controller_1 = require("./merchant-inventory.controller");
const admin_inventory_controller_1 = require("./admin-inventory.controller");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [buyer_module_1.BuyerModule, merchant_module_1.MerchantModule],
        controllers: [merchant_inventory_controller_1.MerchantInventoryController, admin_inventory_controller_1.AdminInventoryController],
        providers: [inventory_service_1.InventoryService, inventory_cache_service_1.InventoryCacheService, inventory_alert_service_1.InventoryAlertService],
        exports: [inventory_service_1.InventoryService, inventory_cache_service_1.InventoryCacheService],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map