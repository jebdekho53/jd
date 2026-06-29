"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDeliveryPartnerLabel = normalizeDeliveryPartnerLabel;
exports.deliveryProviderTypeToKey = deliveryProviderTypeToKey;
exports.deliveryProviderTypeToLabel = deliveryProviderTypeToLabel;
exports.resolveStoreDeliveryPartnerLabel = resolveStoreDeliveryPartnerLabel;
const client_1 = require("@prisma/client");
function normalizeDeliveryPartnerLabel(provider) {
    const key = (provider ?? 'shadowfax').toLowerCase().replace(/-/g, '_');
    switch (key) {
        case 'shadowfax':
            return 'Shadowfax';
        case 'own_fleet':
        case 'ownfleet':
            return 'JebDekho Fleet';
        case 'porter':
            return 'Porter';
        case 'delhivery':
            return 'Delhivery';
        case 'borzo':
            return 'Borzo';
        default:
            return 'JebDekho Partner';
    }
}
function deliveryProviderTypeToKey(type) {
    switch (type) {
        case client_1.DeliveryProviderType.SHADOWFAX:
            return 'shadowfax';
        case client_1.DeliveryProviderType.OWN_FLEET:
            return 'own_fleet';
        case client_1.DeliveryProviderType.PORTER:
            return 'porter';
        case client_1.DeliveryProviderType.DELHIVERY:
            return 'delhivery';
        case client_1.DeliveryProviderType.BORZO:
            return 'borzo';
        default:
            return 'shadowfax';
    }
}
function deliveryProviderTypeToLabel(type) {
    return normalizeDeliveryPartnerLabel(deliveryProviderTypeToKey(type));
}
const FLEET_STORE_TYPES = [
    client_1.StoreType.DARK_STORE,
    client_1.StoreType.WAREHOUSE,
    client_1.StoreType.MICRO_FULFILLMENT_CENTER,
];
function resolveStoreDeliveryPartnerLabel(store, platformProviderKey, ownFleetEnabled = false) {
    if (store.preferredDeliveryProvider) {
        return deliveryProviderTypeToLabel(store.preferredDeliveryProvider);
    }
    if (store.storeType && FLEET_STORE_TYPES.includes(store.storeType) && ownFleetEnabled) {
        return normalizeDeliveryPartnerLabel('own_fleet');
    }
    return normalizeDeliveryPartnerLabel(platformProviderKey);
}
//# sourceMappingURL=logistics-label.util.js.map