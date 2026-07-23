import type { RiderOrder } from './api';

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export function pretty(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** The single next handover step for a delivery, or null when there isn't one. */
export function nextAction(status: string): { verb: string; label: string } | null {
  switch (status) {
    case 'ACCEPTED':
      return { verb: 'arrived-store', label: 'Arrived at store' };
    case 'ARRIVED_AT_STORE':
      return { verb: 'picked-up', label: 'Picked up' };
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return { verb: 'arrived-customer', label: 'Arrived at customer' };
    case 'ARRIVED_AT_CUSTOMER':
      return { verb: 'delivered', label: 'Mark delivered' };
    default:
      return null;
  }
}

export function isActive(order: RiderOrder) {
  return !['DELIVERED', 'FAILED', 'CANCELLED', 'REJECTED'].includes(order.deliveryStatus);
}

export function isNewOffer(status: string) {
  return ['PENDING', 'ASSIGNED', 'OFFERED'].includes(status);
}

export function formatAddress(addr: Record<string, string>) {
  return (
    [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') ||
    'Delivery address'
  );
}
