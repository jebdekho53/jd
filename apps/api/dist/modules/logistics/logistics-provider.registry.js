"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsProviderRegistry = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const logistics_errors_1 = require("./errors/logistics.errors");
const logistics_config_util_1 = require("./utils/logistics-config.util");
const shadowfax_provider_1 = require("./providers/shadowfax/shadowfax.provider");
const stub_providers_1 = require("./providers/stub/stub-providers");
const own_fleet_provider_1 = require("./providers/own-fleet/own-fleet.provider");
let LogisticsProviderRegistry = class LogisticsProviderRegistry {
    constructor(config, shadowfax, porter, delhivery, borzo, ownFleet) {
        this.providers = new Map([
            [client_1.DeliveryProviderType.SHADOWFAX, shadowfax],
            [client_1.DeliveryProviderType.PORTER, porter],
            [client_1.DeliveryProviderType.DELHIVERY, delhivery],
            [client_1.DeliveryProviderType.BORZO, borzo],
            [client_1.DeliveryProviderType.OWN_FLEET, ownFleet],
        ]);
        this.primaryType = (0, logistics_config_util_1.resolvePrimaryProviderType)(config);
    }
    get(type) {
        const provider = this.providers.get(type);
        if (!provider)
            throw new logistics_errors_1.ProviderNotEnabledError(type);
        return provider;
    }
    getPrimary() {
        return this.get(this.primaryType);
    }
    listRegistered() {
        return [...this.providers.keys()];
    }
};
exports.LogisticsProviderRegistry = LogisticsProviderRegistry;
exports.LogisticsProviderRegistry = LogisticsProviderRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, shadowfax_provider_1.ShadowfaxProvider,
        stub_providers_1.PorterProvider,
        stub_providers_1.DelhiveryProvider,
        stub_providers_1.BorzoProvider,
        own_fleet_provider_1.OwnFleetProvider])
], LogisticsProviderRegistry);
//# sourceMappingURL=logistics-provider.registry.js.map