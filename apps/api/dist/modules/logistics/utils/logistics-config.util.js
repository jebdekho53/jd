"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePrimaryProviderType = resolvePrimaryProviderType;
exports.useOwnFleetDispatch = useOwnFleetDispatch;
const client_1 = require("@prisma/client");
function flag(config, key, fallback = false) {
    const raw = config.get(key);
    if (raw === undefined || raw === '')
        return fallback;
    return raw === 'true' || raw === '1';
}
function resolvePrimaryProviderType(config) {
    const requested = (config.get('DELIVERY_PROVIDER', 'shadowfax') ?? 'shadowfax')
        .trim()
        .toLowerCase();
    const enabled = {
        shadowfax: flag(config, 'ENABLE_SHADOWFAX', true),
        porter: flag(config, 'ENABLE_PORTER', false),
        delhivery: flag(config, 'ENABLE_DELHIVERY', false),
        borzo: flag(config, 'ENABLE_BORZO', false),
        own_fleet: flag(config, 'ENABLE_OWN_FLEET', false),
    };
    const typeMap = {
        shadowfax: client_1.DeliveryProviderType.SHADOWFAX,
        porter: client_1.DeliveryProviderType.PORTER,
        delhivery: client_1.DeliveryProviderType.DELHIVERY,
        borzo: client_1.DeliveryProviderType.BORZO,
        own_fleet: client_1.DeliveryProviderType.OWN_FLEET,
    };
    const type = typeMap[requested];
    if (type && enabled[requested])
        return type;
    if (enabled.shadowfax)
        return client_1.DeliveryProviderType.SHADOWFAX;
    if (enabled.own_fleet)
        return client_1.DeliveryProviderType.OWN_FLEET;
    if (enabled.porter)
        return client_1.DeliveryProviderType.PORTER;
    if (enabled.delhivery)
        return client_1.DeliveryProviderType.DELHIVERY;
    if (enabled.borzo)
        return client_1.DeliveryProviderType.BORZO;
    return client_1.DeliveryProviderType.SHADOWFAX;
}
function useOwnFleetDispatch(config) {
    return (flag(config, 'ENABLE_OWN_FLEET', false) &&
        resolvePrimaryProviderType(config) === client_1.DeliveryProviderType.OWN_FLEET);
}
//# sourceMappingURL=logistics-config.util.js.map