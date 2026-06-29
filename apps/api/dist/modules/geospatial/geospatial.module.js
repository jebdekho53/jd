"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeospatialModule = void 0;
const common_1 = require("@nestjs/common");
const buyer_module_1 = require("../buyer/buyer.module");
const delivery_tracking_module_1 = require("../delivery-tracking/delivery-tracking.module");
const fleet_os_module_1 = require("../fleet-os/fleet-os.module");
const ai_commerce_module_1 = require("../ai-commerce/ai-commerce.module");
const location_directory_module_1 = require("../location-directory/location-directory.module");
const geospatial_service_1 = require("./geospatial.service");
const geospatial_controller_1 = require("./geospatial.controller");
const admin_store_geo_controller_1 = require("./admin-store-geo.controller");
let GeospatialModule = class GeospatialModule {
};
exports.GeospatialModule = GeospatialModule;
exports.GeospatialModule = GeospatialModule = __decorate([
    (0, common_1.Module)({
        imports: [buyer_module_1.BuyerModule, delivery_tracking_module_1.DeliveryTrackingModule, fleet_os_module_1.FleetOsModule, ai_commerce_module_1.AICommerceModule, location_directory_module_1.LocationDirectoryModule],
        controllers: [
            geospatial_controller_1.BuyerGeospatialController,
            geospatial_controller_1.AdminGeospatialController,
            admin_store_geo_controller_1.AdminStoreGeoController,
            geospatial_controller_1.MerchantGeospatialController,
        ],
        providers: [geospatial_service_1.GeospatialService],
        exports: [geospatial_service_1.GeospatialService],
    })
], GeospatialModule);
//# sourceMappingURL=geospatial.module.js.map