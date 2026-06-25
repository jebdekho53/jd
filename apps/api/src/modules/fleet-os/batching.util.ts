export interface BatchableOrder {
  orderId: string;
  locality: string;
  pickupZoneId: string;
  deliveryLat: number;
  deliveryLng: number;
}

export const MAX_BATCH_SIZE = 3;

/** Group orders by locality + pickup zone; max 3 per batch */
export function groupOrdersIntoBatches(orders: BatchableOrder[]): BatchableOrder[][] {
  const groups = new Map<string, BatchableOrder[]>();
  for (const o of orders) {
    const key = `${o.locality}|${o.pickupZoneId}`;
    const list = groups.get(key) ?? [];
    list.push(o);
    groups.set(key, list);
  }

  const batches: BatchableOrder[][] = [];
  for (const list of groups.values()) {
    for (let i = 0; i < list.length; i += MAX_BATCH_SIZE) {
      batches.push(list.slice(i, i + MAX_BATCH_SIZE));
    }
  }
  return batches;
}
