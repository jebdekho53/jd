"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FulfillmentNetworkModule = void 0;
const common_1 = require("@nestjs/common");
const merchant_dashboard_module_1 = require("../merchant-dashboard/merchant-dashboard.module");
const smart_fulfillment_service_1 = require("./smart-fulfillment.service");
const capacity_service_1 = require("./capacity.service");
const inventory_transfer_service_1 = require("./inventory-transfer.service");
const rebalancing_service_1 = require("./rebalancing.service");
const fulfillment_network_service_1 = require("./fulfillment-network.service");
const admin_fulfillment_network_service_1 = require("./admin-fulfillment-network.service");
const merchant_fulfillment_network_controller_1 = require("./merchant-fulfillment-network.controller");
const admin_fulfillment_network_controller_1 = require("./admin-fulfillment-network.controller");
let FulfillmentNetworkModule = class FulfillmentNetworkModule {
};
exports.FulfillmentNetworkModule = FulfillmentNetworkModule;
exports.FulfillmentNetworkModule = FulfillmentNetworkModule = __decorate([
    (0, common_1.Module)({
        imports: [merchant_dashboard_module_1.MerchantDashboardModule],
        controllers: [merchant_fulfillment_network_controller_1.MerchantFulfillmentNetworkController, admin_fulfillment_network_controller_1.AdminFulfillmentNetworkController],
        providers: [
            smart_fulfillment_service_1.SmartFulfillmentService,
            capacity_service_1.CapacityService,
            inventory_transfer_service_1.InventoryTransferService,
            rebalancing_service_1.RebalancingService,
            fulfillment_network_service_1.FulfillmentNetworkService,
            admin_fulfillment_network_service_1.AdminFulfillmentNetworkService,
        ],
        exports: [smart_fulfillment_service_1.SmartFulfillmentService, capacity_service_1.CapacityService],
    })
], FulfillmentNetworkModule);
//# sourceMappingURL=fulfillment-network.module.js.map