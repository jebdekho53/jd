"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnFleetProvider = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const logistics_errors_1 = require("../../errors/logistics.errors");
let OwnFleetProvider = class OwnFleetProvider {
    constructor() {
        this.type = client_1.DeliveryProviderType.OWN_FLEET;
    }
    notViaApi() {
        throw new logistics_errors_1.ProviderNotImplementedError(client_1.DeliveryProviderType.OWN_FLEET);
    }
    createShipment() { return this.notViaApi(); }
    cancelShipment() { return this.notViaApi(); }
    trackShipment() { return this.notViaApi(); }
    estimatePrice() { return this.notViaApi(); }
    estimateETA() { return this.notViaApi(); }
    getProofOfDelivery() { return this.notViaApi(); }
    healthCheck() {
        return Promise.resolve({ healthy: true, message: 'Own fleet uses in-house rider assignment' });
    }
};
exports.OwnFleetProvider = OwnFleetProvider;
exports.OwnFleetProvider = OwnFleetProvider = __decorate([
    (0, common_1.Injectable)()
], OwnFleetProvider);
//# sourceMappingURL=own-fleet.provider.js.map