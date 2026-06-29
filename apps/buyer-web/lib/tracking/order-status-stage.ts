import type { OrderStatus } from '@/types/orders';

export interface OrderStatusStage {
  key: string;
  label: string;
  statuses: OrderStatus[];
}

/** Blinkit-style prep + delivery stages for the live status stepper. */
export const ORDER_STATUS_STAGES: OrderStatusStage[] = [
  {
    key: 'placed',
    label: 'Order placed',
    statuses: ['CREATED', 'PAYMENT_PENDING', 'PAID'],
  },
  {
    key: 'confirmed',
    label: 'Order confirmed',
    statuses: ['MERCHANT_ACCEPTED'],
  },
  {
    key: 'preparing',
    label: 'Store is preparing',
    statuses: ['PREPARING'],
  },
  {
    key: 'packing',
    label: 'Packing your order',
    statuses: ['PACKING'],
  },
  {
    key: 'ready',
    label: 'Ready for pickup',
    statuses: ['READY_FOR_PICKUP'],
  },
  {
    key: 'rider_assigned',
    label: 'Rider assigned',
    statuses: ['RIDER_ASSIGNED'],
  },
  {
    key: 'on_the_way',
    label: 'On the way',
    statuses: ['PICKED_UP', 'OUT_FOR_DELIVERY'],
  },
  {
    key: 'delivered',
    label: 'Delivered',
    statuses: ['DELIVERED', 'COMPLETED'],
  },
];

const STATUS_TO_STAGE_INDEX = new Map<OrderStatus, number>();
ORDER_STATUS_STAGES.forEach((stage, index) => {
  for (const status of stage.statuses) {
    STATUS_TO_STAGE_INDEX.set(status, index);
  }
});

export function getOrderStatusStageIndex(status: OrderStatus): number {
  return STATUS_TO_STAGE_INDEX.get(status) ?? 0;
}

export function getOrderStatusStageLabel(status: OrderStatus): string {
  const index = getOrderStatusStageIndex(status);
  return ORDER_STATUS_STAGES[index]?.label ?? 'Order placed';
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return ![
    'CANCELLED_BY_BUYER',
    'CANCELLED_BY_MERCHANT',
    'CANCELLED_BY_ADMIN',
    'PAYMENT_FAILED',
    'DELIVERY_FAILED',
    'REFUNDED',
    'COMPLETED',
    'DELIVERED',
  ].includes(status);
}
