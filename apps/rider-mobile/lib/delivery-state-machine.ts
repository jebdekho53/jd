import type { DeliveryStatus, DeliveryAction } from '@/types/order';

/** Mirrors backend DELIVERY_NEXT state machine */
export const DELIVERY_NEXT: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  ASSIGNED: 'ACCEPTED',
  ACCEPTED: 'ARRIVED_AT_STORE',
  ARRIVED_AT_STORE: 'PICKED_UP',
  PICKED_UP: 'ARRIVED_AT_CUSTOMER',
  ARRIVED_AT_CUSTOMER: 'DELIVERED',
};

const TERMINAL = new Set<DeliveryStatus>(['DELIVERED', 'FAILED', 'CANCELLED', 'REJECTED']);

export function getNextStatus(current: DeliveryStatus): DeliveryStatus | null {
  return DELIVERY_NEXT[current] ?? null;
}

export function canAdvance(current: DeliveryStatus, target: DeliveryStatus): boolean {
  return getNextStatus(current) === target;
}

export function isTerminal(status: DeliveryStatus): boolean {
  return TERMINAL.has(status);
}

export function isActiveDelivery(status: DeliveryStatus): boolean {
  return !isTerminal(status) && status !== 'ASSIGNED';
}

export function statusToAction(next: DeliveryStatus): DeliveryAction | null {
  const map: Partial<Record<DeliveryStatus, DeliveryAction>> = {
    ACCEPTED: 'accept',
    ARRIVED_AT_STORE: 'arrived-store',
    PICKED_UP: 'picked-up',
    ARRIVED_AT_CUSTOMER: 'arrived-customer',
    DELIVERED: 'delivered',
  };
  return map[next] ?? null;
}

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  ASSIGNED: 'New assignment',
  ACCEPTED: 'Accepted',
  ARRIVED_AT_STORE: 'At store',
  PICKED_UP: 'Picked up',
  ARRIVED_AT_CUSTOMER: 'At customer',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

export const ACTION_LABELS: Record<DeliveryAction, string> = {
  accept: 'Accept delivery',
  reject: 'Decline',
  'arrived-store': 'Arrived at store',
  'picked-up': 'Picked up order',
  'arrived-customer': 'Arrived at customer',
  delivered: 'Mark delivered',
  failed: 'Mark failed',
};
