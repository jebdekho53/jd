import type { MerchantOrderListItem, OrderStatus } from '@/types/order';

export const LIVE_ORDER_GROUPS = [
  { key: 'incoming', label: 'Incoming', statuses: ['PAID', 'MERCHANT_ACCEPTED'] },
  { key: 'prep', label: 'Preparation', statuses: ['PREPARING'] },
  { key: 'pack', label: 'Packing', statuses: ['PACKING'] },
  { key: 'ready', label: 'Ready Queue', statuses: ['READY_FOR_PICKUP'] },
  { key: 'dispatch', label: 'Dispatch', statuses: ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] },
] as const satisfies readonly {
  key: string;
  label: string;
  statuses: readonly OrderStatus[];
}[];

export type LiveOrderGroupKey = (typeof LIVE_ORDER_GROUPS)[number]['key'];

export const LIVE_ORDER_ACTIVE_STATUSES = LIVE_ORDER_GROUPS.flatMap((group) => group.statuses);

function hasStatus(statuses: readonly OrderStatus[], status: OrderStatus): boolean {
  return statuses.includes(status);
}

export function liveOrderGroupForStatus(status: OrderStatus): LiveOrderGroupKey | null {
  return LIVE_ORDER_GROUPS.find((group) => hasStatus(group.statuses, status))?.key ?? null;
}

export function groupLiveOrders(orders: MerchantOrderListItem[]) {
  return Object.fromEntries(
    LIVE_ORDER_GROUPS.map((group) => [
      group.key,
      orders.filter((order) => hasStatus(group.statuses, order.status)),
    ]),
  ) as Record<LiveOrderGroupKey, MerchantOrderListItem[]>;
}
