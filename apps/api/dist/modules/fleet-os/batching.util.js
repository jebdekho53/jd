"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_BATCH_SIZE = void 0;
exports.groupOrdersIntoBatches = groupOrdersIntoBatches;
exports.MAX_BATCH_SIZE = 3;
function groupOrdersIntoBatches(orders) {
    const groups = new Map();
    for (const o of orders) {
        const key = `${o.locality}|${o.pickupZoneId}`;
        const list = groups.get(key) ?? [];
        list.push(o);
        groups.set(key, list);
    }
    const batches = [];
    for (const list of groups.values()) {
        for (let i = 0; i < list.length; i += exports.MAX_BATCH_SIZE) {
            batches.push(list.slice(i, i + exports.MAX_BATCH_SIZE));
        }
    }
    return batches;
}
//# sourceMappingURL=batching.util.js.map