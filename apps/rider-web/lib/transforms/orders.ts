/** Maps NestJS delivery entities → rider-mobile contract */

export interface BackendDelivery {
  id: string;
  orderId: string;
  status: string;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  distanceKm: number | null;
  estimatedMins: number | null;
  riderEarning: string | number | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentMethod: string;
    totalAmount: string | number;
    deliveryAddress: Record<string, string> | null;
    deliveryLat?: number | null;
    deliveryLng?: number | null;
    buyerNote?: string | null;
    store: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      phone: string | null;
      line1?: string;
    };
    items?: { productName: string; variantName: string; quantity: number }[];
  };
}

export function mapDeliveryListItem(d: BackendDelivery) {
  const addr = (d.order.deliveryAddress ?? {}) as Record<string, string>;
  return {
    deliveryId: d.id,
    orderId: d.order.id,
    orderNumber: d.order.orderNumber,
    deliveryStatus: d.status,
    storeName: d.order.store.name,
    storeLat: d.order.store.latitude,
    storeLng: d.order.store.longitude,
    customerLat: d.deliveryLat ?? d.order.deliveryLat ?? 0,
    customerLng: d.deliveryLng ?? d.order.deliveryLng ?? 0,
    customerArea: [addr.line1, addr.city].filter(Boolean).join(', ') || 'Delivery address',
    totalAmount: Number(d.order.totalAmount),
    paymentMethod: d.order.paymentMethod,
    assignedAt: d.assignedAt ?? d.createdAt,
    riderEarning: d.riderEarning != null ? Number(d.riderEarning) : null,
  };
}

export function mapDeliveryDetail(d: BackendDelivery) {
  const base = mapDeliveryListItem(d);
  const addr = (d.order.deliveryAddress ?? {}) as Record<string, string>;
  const timeline: { status: string; at: string }[] = [];
  if (d.assignedAt) timeline.push({ status: 'ASSIGNED', at: d.assignedAt });
  if (d.pickedUpAt) timeline.push({ status: 'PICKED_UP', at: d.pickedUpAt });
  if (d.deliveredAt) timeline.push({ status: 'DELIVERED', at: d.deliveredAt });

  return {
    ...base,
    storePhone: d.order.store.phone,
    storeAddress: d.order.store.line1 ?? d.order.store.name,
    deliveryAddress: addr,
    buyerNote: d.order.buyerNote ?? null,
    distanceKm: d.distanceKm,
    estimatedMins: d.estimatedMins,
    items: (d.order.items ?? []).map((i) => ({
      name: i.productName,
      variant: i.variantName,
      quantity: i.quantity,
    })),
    timeline,
  };
}
