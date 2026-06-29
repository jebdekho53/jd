"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorzoProvider = exports.DelhiveryProvider = exports.PorterProvider = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const logistics_errors_1 = require("../../errors/logistics.errors");
let PorterProvider = class PorterProvider {
    constructor() {
        this.type = client_1.DeliveryProviderType.PORTER;
    }
    notReady() {
        throw new logistics_errors_1.ProviderNotImplementedError(client_1.DeliveryProviderType.PORTER);
    }
    createShipment() { return this.notReady(); }
    cancelShipment() { return this.notReady(); }
    trackShipment() { return this.notReady(); }
    estimatePrice() { return this.notReady(); }
    estimateETA() { return this.notReady(); }
    getProofOfDelivery() { return this.notReady(); }
    healthCheck() { return this.notReady(); }
};
exports.PorterProvider = PorterProvider;
exports.PorterProvider = PorterProvider = __decorate([
    (0, common_1.Injectable)()
], PorterProvider);
let DelhiveryProvider = class DelhiveryProvider {
    constructor() {
        this.type = client_1.DeliveryProviderType.DELHIVERY;
    }
    notReady() {
        throw new logistics_errors_1.ProviderNotImplementedError(client_1.DeliveryProviderType.DELHIVERY);
    }
    createShipment() { return this.notReady(); }
    cancelShipment() { return this.notReady(); }
    trackShipment() { return this.notReady(); }
    estimatePrice() { return this.notReady(); }
    estimateETA() { return this.notReady(); }
    getProofOfDelivery() { return this.notReady(); }
    healthCheck() { return this.notReady(); }
};
exports.DelhiveryProvider = DelhiveryProvider;
exports.DelhiveryProvider = DelhiveryProvider = __decorate([
    (0, common_1.Injectable)()
], DelhiveryProvider);
let BorzoProvider = class BorzoProvider {
    constructor() {
        this.type = client_1.DeliveryProviderType.BORZO;
    }
    notReady() {
        throw new logistics_errors_1.ProviderNotImplementedError(client_1.DeliveryProviderType.BORZO);
    }
    createShipment() { return this.notReady(); }
    cancelShipment() { return this.notReady(); }
    trackShipment() { return this.notReady(); }
    estimatePrice() { return this.notReady(); }
    estimateETA() { return this.notReady(); }
    getProofOfDelivery() { return this.notReady(); }
    healthCheck() { return this.notReady(); }
};
exports.BorzoProvider = BorzoProvider;
exports.BorzoProvider = BorzoProvider = __decorate([
    (0, common_1.Injectable)()
], BorzoProvider);
//# sourceMappingURL=stub-providers.js.map